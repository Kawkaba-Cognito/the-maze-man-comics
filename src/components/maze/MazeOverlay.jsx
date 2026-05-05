import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';

export default function MazeOverlay() {
  const { exitMaze, updateXP, playSfx, currentLang, globalXP } = useApp();
  const [mazeScreen, setMazeScreen] = useState('none'); // 'none' | 'puzzle' | 'victory'
  const [instruction, setInstruction] = useState('Look down. Click the labyrinth to enter.');
  const canvasRef = useRef(null);
  const joyCanvasRef = useRef(null);
  const joyWrapRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const isMazeActiveRef = useRef(false);
  const isAtBossRef = useRef(false);
  const langRef = useRef(currentLang);

  useEffect(() => { langRef.current = currentLang; }, [currentLang]);

  function handleExitToHub() {
    playSfx('click');
    exitMaze();
  }

  function checkPuzzle() {
    const input = document.getElementById('puzzle-answer');
    const answer = input ? input.value.toLowerCase().trim() : '';
    if (answer === 'attention') {
      playSfx('win');
      updateXP(100);
      setMazeScreen('victory');
    } else {
      playSfx('error');
      if (input) { input.value = ''; input.placeholder = 'ERROR. Try again...'; }
    }
  }

  useEffect(() => {
    if (typeof window.BABYLON === 'undefined') return;
    const BABYLON = window.BABYLON;
    const canvas3D = canvasRef.current;
    if (!canvas3D) return;

    let engine, scene, camera, shadowGenerator, particleSystem;
    let isMazeActive = false, isAtBoss = false;
    const size = 31, cellSize = 4, MAZE_OFFSET_Y = -60;
    let maze = Array(size).fill(null).map(() => Array(size).fill(1));
    let playerCollider, playerVisual, stickmanRig = {}, collectibles = [];
    const inputMap = {};
    let joyInput = { x: 0, z: 0 };
    let targetPosition = null, isPointerDown = false, bossPosition = null;

    try {
      engine = new BABYLON.Engine(canvas3D, true, { antialias: true });
      engineRef.current = engine;

      const createScene = function () {
        const s = new BABYLON.Scene(engine);
        s.clearColor = new BABYLON.Color4(0.01, 0.01, 0.02, 1);
        s.collisionsEnabled = true;

        camera = new BABYLON.ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2.5, 15, BABYLON.Vector3.Zero(), s);
        camera.attachControl(canvas3D, true);
        camera.lowerRadiusLimit = 5; camera.upperRadiusLimit = 80;

        const ambientLight = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), s);
        ambientLight.intensity = 0.3;
        const dirLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-1, -2, 1), s);
        dirLight.intensity = 1.0; dirLight.position = new BABYLON.Vector3(0, 50, 0);
        shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
        shadowGenerator.useBlurExponentialShadowMap = true; shadowGenerator.blurKernel = 32;

        const pipeline = new BABYLON.DefaultRenderingPipeline('pipeline', true, s, [camera]);
        pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.3; pipeline.bloomWeight = 1.2;

        const skybox = BABYLON.MeshBuilder.CreateBox('skyBox', { size: 1000.0 }, s);
        const skyboxMaterial = new BABYLON.StandardMaterial('skyBox', s);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/skybox', s);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const bjsPlanetMat = new BABYLON.PBRMaterial('planet', s);
        bjsPlanetMat.albedoColor = new BABYLON.Color3(0.8, 0.35, 0.15);
        bjsPlanetMat.metallic = 0.05; bjsPlanetMat.roughness = 0.9;
        bjsPlanetMat.bumpTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/rockn.png', s);
        bjsPlanetMat.bumpTexture.level = 1.5;
        const planet = BABYLON.MeshBuilder.CreateSphere('planet', { diameter: 6, segments: 64 }, s);
        planet.material = bjsPlanetMat;

        const bjsStars = new BABYLON.ParticleSystem('stars', 3000, s);
        bjsStars.particleTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/flare.png', s);
        bjsStars.emitter = new BABYLON.Vector3(0, 0, 80);
        bjsStars.minEmitBox = new BABYLON.Vector3(-60, -60, 0); bjsStars.maxEmitBox = new BABYLON.Vector3(60, 60, 0);
        bjsStars.direction1 = new BABYLON.Vector3(0, 0, -1); bjsStars.direction2 = new BABYLON.Vector3(0, 0, -1);
        bjsStars.minEmitPower = 40; bjsStars.maxEmitPower = 80; bjsStars.updateSpeed = 0.015;
        bjsStars.color1 = new BABYLON.Color4(1, 0.8, 0.6, 1); bjsStars.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        bjsStars.minSize = 0.05; bjsStars.maxSize = 0.4; bjsStars.minLifeTime = 1; bjsStars.maxLifeTime = 3;
        bjsStars.emitRate = 1200; bjsStars.start();

        // Build player
        playerCollider = BABYLON.MeshBuilder.CreateBox('collider', { width: 1.5, height: 4.0, depth: 1.5 }, s);
        playerCollider.isVisible = false; playerCollider.checkCollisions = true;
        playerCollider.ellipsoid = new BABYLON.Vector3(0.7, 2.0, 0.7);
        playerVisual = new BABYLON.TransformNode('stickman'); playerVisual.parent = playerCollider; playerVisual.position.y = -2.0;
        const blackMat = new BABYLON.StandardMaterial('blackMat', s);
        blackMat.diffuseColor = new BABYLON.Color3(0.01, 0.01, 0.01); blackMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        const torso = BABYLON.MeshBuilder.CreateCylinder('torso', { height: 1.5, diameterTop: 0.8, diameterBottom: 0.4 }, s);
        torso.position.y = 1.8; torso.material = blackMat; torso.parent = playerVisual; shadowGenerator.addShadowCaster(torso);
        const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 0.8 }, s);
        head.position.y = 1.0; head.material = blackMat; head.parent = torso; shadowGenerator.addShadowCaster(head);
        const leftHip = new BABYLON.TransformNode('leftHip'); leftHip.parent = torso; leftHip.position = new BABYLON.Vector3(-0.25, -0.75, 0);
        const rightHip = new BABYLON.TransformNode('rightHip'); rightHip.parent = torso; rightHip.position = new BABYLON.Vector3(0.25, -0.75, 0);
        const leftShoulder = new BABYLON.TransformNode('leftShoulder'); leftShoulder.parent = torso; leftShoulder.position = new BABYLON.Vector3(-0.5, 0.6, 0);
        const rightShoulder = new BABYLON.TransformNode('rightShoulder'); rightShoulder.parent = torso; rightShoulder.position = new BABYLON.Vector3(0.5, 0.6, 0);
        const legL = BABYLON.MeshBuilder.CreateCylinder('legL', { height: 1.4, diameterTop: 0.35, diameterBottom: 0.15 }, s); legL.position.y = -0.7; legL.material = blackMat; legL.parent = leftHip; shadowGenerator.addShadowCaster(legL);
        const legR = BABYLON.MeshBuilder.CreateCylinder('legR', { height: 1.4, diameterTop: 0.35, diameterBottom: 0.15 }, s); legR.position.y = -0.7; legR.material = blackMat; legR.parent = rightHip; shadowGenerator.addShadowCaster(legR);
        const armL = BABYLON.MeshBuilder.CreateCylinder('armL', { height: 1.2, diameterTop: 0.3, diameterBottom: 0.15 }, s); armL.position.y = -0.6; armL.material = blackMat; armL.parent = leftShoulder; shadowGenerator.addShadowCaster(armL);
        const armR = BABYLON.MeshBuilder.CreateCylinder('armR', { height: 1.2, diameterTop: 0.3, diameterBottom: 0.15 }, s); armR.position.y = -0.6; armR.material = blackMat; armR.parent = rightShoulder; shadowGenerator.addShadowCaster(armR);
        stickmanRig = { torso, leftHip, rightHip, leftShoulder, rightShoulder };
        const playerLight = new BABYLON.PointLight('pLight', new BABYLON.Vector3(0, 3, 0), s);
        playerLight.diffuse = new BABYLON.Color3(1, 0.6, 0.2); playerLight.intensity = 1.8; playerLight.parent = playerVisual;

        // Build maze
        function carve(x, y) {
          maze[y][x] = 0;
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]]; dirs.sort(() => Math.random() - 0.5);
          for (let i = 0; i < dirs.length; i++) {
            const nx = x + dirs[i][0]*2, ny = y + dirs[i][1]*2;
            if (nx>0 && nx<size-1 && ny>0 && ny<size-1 && maze[ny][nx]===1) { maze[y+dirs[i][1]][x+dirs[i][0]] = 0; carve(nx,ny); }
          }
        }
        carve(1,1);
        const c = Math.floor(size/2);
        for (let dy=-1;dy<=1;dy++) for (let dx=-1;dx<=1;dx++) maze[c+dy][c+dx]=0;
        maze[c-2][c]=0; maze[c-3][c]=0;

        const wallBase = BABYLON.MeshBuilder.CreateBox('wallBase', { width: cellSize, height: cellSize*1.5, depth: cellSize }, s);
        const wallMat = new BABYLON.PBRMaterial('wallMat', s);
        wallMat.albedoTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/rock.png', s);
        wallMat.bumpTexture = new BABYLON.Texture('https://playground.babylonjs.com/textures/rockn.png', s);
        wallMat.metallic=0.2; wallMat.roughness=0.9; wallMat.albedoColor=new BABYLON.Color3(0.5,0.2,0.1);
        wallBase.material=wallMat; wallBase.isVisible=false;
        const fragMat = new BABYLON.StandardMaterial('fragMat', s);
        fragMat.emissiveColor = new BABYLON.Color3(0,1,0.5); fragMat.wireframe=true;
        const offset = (size*cellSize)/2;
        for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
          if (maze[y][x]===1) {
            const w = wallBase.createInstance(`w_${x}_${y}`);
            w.position = new BABYLON.Vector3((x*cellSize)-offset, MAZE_OFFSET_Y+cellSize/2, (y*cellSize)-offset);
            w.checkCollisions=true; w.isMaze=true; shadowGenerator.addShadowCaster(w);
          } else if (maze[y][x]===0 && Math.random()<0.08 && !(x===c && y===c)) {
            const frag = BABYLON.MeshBuilder.CreateIcoSphere('frag', { radius:0.6, subdivisions:2 }, s);
            frag.position = new BABYLON.Vector3((x*cellSize)-offset, MAZE_OFFSET_Y+1.5, (y*cellSize)-offset);
            frag.material=fragMat; collectibles.push(frag);
          }
        }
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: size*cellSize+10, height: size*cellSize+10 }, s);
        const groundMat = new BABYLON.StandardMaterial('grassMat', s);
        const grassTex = new BABYLON.Texture('https://playground.babylonjs.com/textures/grass.png', s);
        grassTex.uScale=25; grassTex.vScale=25; groundMat.diffuseTexture=grassTex;
        groundMat.specularColor=new BABYLON.Color3(0.05,0.05,0.05);
        ground.material=groundMat; ground.receiveShadows=true; ground.checkCollisions=true; ground.isMaze=true; ground.position.y=MAZE_OFFSET_Y;
        playerCollider.position = new BABYLON.Vector3((1*cellSize)-offset, MAZE_OFFSET_Y+2.0, (1*cellSize)-offset);
        bossPosition = new BABYLON.Vector3((c*cellSize)-offset, MAZE_OFFSET_Y+0.5, (c*cellSize)-offset);
        const bossOrb = BABYLON.MeshBuilder.CreateSphere('bossOrb', { diameter:2.5 }, s);
        bossOrb.material = s.getMaterialByName('planet'); bossOrb.position=bossPosition;
        const nodeLight = new BABYLON.PointLight('nodeLight', new BABYLON.Vector3(bossPosition.x, MAZE_OFFSET_Y+3, bossPosition.z), s);
        nodeLight.diffuse=new BABYLON.Color3(1,0.4,0); nodeLight.intensity=2;

        // Particle effects
        const dt = new BABYLON.DynamicTexture('dustTex', 64, s);
        const dtCtx = dt.getContext(); dtCtx.fillStyle='rgba(100,150,100,1)'; dtCtx.beginPath(); dtCtx.arc(32,32,30,0,Math.PI*2); dtCtx.fill(); dt.update();
        particleSystem = new BABYLON.ParticleSystem('dust', 500, s); particleSystem.particleTexture=dt;
        particleSystem.emitter=playerCollider; particleSystem.color1=new BABYLON.Color4(0.3,0.5,0.3,0.6);
        particleSystem.colorDead=new BABYLON.Color4(0,0,0,0); particleSystem.minSize=0.3; particleSystem.maxSize=0.8;
        particleSystem.minLifeTime=0.2; particleSystem.maxLifeTime=0.5; particleSystem.createSphereEmitter(0.5); particleSystem.emitRate=0;

        // Virtual joystick
        const joyCanvas = joyCanvasRef.current;
        const joyWrap = joyWrapRef.current;
        if (joyCanvas && joyWrap) {
          const jCtx = joyCanvas.getContext('2d'); let touchPos = null;
          function drawJoystick() { jCtx.clearRect(0,0,150,150); jCtx.beginPath(); jCtx.arc(75,75,50,0,Math.PI*2); jCtx.fillStyle='rgba(255,255,255,0.1)'; jCtx.fill(); jCtx.strokeStyle='rgba(255,255,255,0.4)'; jCtx.stroke(); let kx=75,ky=75; if(touchPos){kx=touchPos.x;ky=touchPos.y;} jCtx.beginPath(); jCtx.arc(kx,ky,25,0,Math.PI*2); jCtx.fillStyle='rgba(255,255,255,0.7)'; jCtx.fill(); requestAnimationFrame(drawJoystick); } drawJoystick();
          function updateJoystick(e) { e.preventDefault(); let clientX,clientY; if(e.touches){clientX=e.touches[0].clientX;clientY=e.touches[0].clientY;}else{clientX=e.clientX;clientY=e.clientY;} const rect=joyCanvas.getBoundingClientRect(); let dx=(clientX-rect.left)-75; let dy=(clientY-rect.top)-75; let distance=Math.min(Math.hypot(dx,dy),50); let angle=Math.atan2(dy,dx); touchPos={x:75+Math.cos(angle)*distance,y:75+Math.sin(angle)*distance}; joyInput.x=Math.cos(angle)*(distance/50); joyInput.z=-Math.sin(angle)*(distance/50); }
          joyWrap.addEventListener('touchstart',updateJoystick,{passive:false}); joyWrap.addEventListener('touchmove',updateJoystick,{passive:false}); joyWrap.addEventListener('touchend',()=>{touchPos=null;joyInput={x:0,z:0};}); let isMouseJoy=false; joyWrap.addEventListener('mousedown',(e)=>{isMouseJoy=true;updateJoystick(e);}); joyWrap.addEventListener('mousemove',(e)=>{if(isMouseJoy)updateJoystick(e);}); window.addEventListener('mouseup',()=>{isMouseJoy=false;touchPos=null;joyInput={x:0,z:0};});
        }

        // enterCinematicMaze / exitCinematicMaze
        function enterCinematicMaze() {
          camera.detachControl(); setInstruction(''); targetPosition=null;
          const frames=90;
          const tA=new BABYLON.Animation('tA','target',60,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); tA.setKeys([{frame:0,value:camera.target},{frame:frames,value:playerCollider.position.clone()}]);
          const bA=new BABYLON.Animation('bA','beta',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); bA.setKeys([{frame:0,value:camera.beta},{frame:frames,value:0.01}]);
          const rA=new BABYLON.Animation('rA','radius',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); rA.setKeys([{frame:0,value:camera.radius},{frame:frames,value:45}]);
          const aA=new BABYLON.Animation('aA','alpha',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); aA.setKeys([{frame:0,value:camera.alpha},{frame:frames,value:-Math.PI/2}]);
          const ease=new BABYLON.CubicEase(); ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          [tA,bA,rA,aA].forEach(a=>a.setEasingFunction(ease));
          camera.animations=[tA,bA,rA,aA];
          s.beginAnimation(camera,0,frames,false,1,()=>{
            isMazeActive=true; isMazeActiveRef.current=true;
            if(joyWrapRef.current) joyWrapRef.current.style.display='block';
            setInstruction('Use Joystick or WASD to navigate. Collect fragments!');
          });
        }

        function exitCinematicMaze() {
          isMazeActive=false; isMazeActiveRef.current=false;
          if(joyWrapRef.current) joyWrapRef.current.style.display='none';
          setInstruction('');
          const off=(size*cellSize)/2; playerCollider.position=new BABYLON.Vector3((1*cellSize)-off,MAZE_OFFSET_Y+2.0,(1*cellSize)-off); isAtBoss=false; isAtBossRef.current=false;
          const frames=90;
          const tA=new BABYLON.Animation('tA2','target',60,BABYLON.Animation.ANIMATIONTYPE_VECTOR3,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); tA.setKeys([{frame:0,value:camera.target},{frame:frames,value:BABYLON.Vector3.Zero()}]);
          const bA=new BABYLON.Animation('bA2','beta',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); bA.setKeys([{frame:0,value:camera.beta},{frame:frames,value:Math.PI/2.5}]);
          const rA=new BABYLON.Animation('rA2','radius',60,BABYLON.Animation.ANIMATIONTYPE_FLOAT,BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT); rA.setKeys([{frame:0,value:camera.radius},{frame:frames,value:15}]);
          const ease=new BABYLON.CubicEase(); ease.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
          [tA,bA,rA].forEach(a=>a.setEasingFunction(ease));
          camera.animations=[tA,bA,rA];
          s.beginAnimation(camera,0,frames,false,1,()=>{ camera.attachControl(canvas3D,true); setInstruction('Look down. Click the labyrinth to enter.'); });
        }

        s.registerBeforeRender(()=>{ planet.rotation.y+=0.001; skybox.rotation.y+=0.0003; if(isMazeActive&&!isAtBoss){camera.target.x=playerCollider.position.x;camera.target.z=playerCollider.position.z;} });

        s.onPointerObservable.add((pi)=>{
          if(!isMazeActive){
            if(!isAtBoss&&pi.type===BABYLON.PointerEventTypes.POINTERDOWN&&pi.pickInfo.hit&&pi.pickInfo.pickedMesh&&pi.pickInfo.pickedMesh.isMaze){enterCinematicMaze();} return;
          }
          switch(pi.type){
            case BABYLON.PointerEventTypes.POINTERDOWN: isPointerDown=true; if(pi.pickInfo.hit&&pi.pickInfo.pickedMesh.name==='ground'){targetPosition=pi.pickInfo.pickedPoint.clone();targetPosition.y=playerCollider.position.y;} break;
            case BABYLON.PointerEventTypes.POINTERMOVE: if(isPointerDown&&pi.pickInfo.hit&&pi.pickInfo.pickedMesh.name==='ground'){targetPosition=pi.pickInfo.pickedPoint.clone();targetPosition.y=playerCollider.position.y;} break;
            case BABYLON.PointerEventTypes.POINTERUP: isPointerDown=false; break;
          }
        });

        s.actionManager=new BABYLON.ActionManager(s);
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger,(evt)=>{inputMap[evt.sourceEvent.key.toLowerCase()]=true;}));
        s.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger,(evt)=>{inputMap[evt.sourceEvent.key.toLowerCase()]=false;}));

        let speed=0.35, walkCycle=0;
        s.onBeforeRenderObservable.add(()=>{
          if(!isMazeActive||isAtBoss) return;
          for(let i=collectibles.length-1;i>=0;i--){
            collectibles[i].rotation.y+=0.05;
            if(BABYLON.Vector3.Distance(playerCollider.position,collectibles[i].position)<2){ playSfx('collect'); updateXP(10); collectibles[i].dispose(); collectibles.splice(i,1); }
          }
          let moveVec=new BABYLON.Vector3(0,-0.2,0); let isMoving=false,isManualInput=false,dirX=0,dirZ=0;
          if(inputMap['w']||inputMap['arrowup']){dirZ=1;isManualInput=true;}
          if(inputMap['s']||inputMap['arrowdown']){dirZ=-1;isManualInput=true;}
          if(inputMap['a']||inputMap['arrowleft']){dirX=-1;isManualInput=true;}
          if(inputMap['d']||inputMap['arrowright']){dirX=1;isManualInput=true;}
          if(isManualInput){targetPosition=null;const len=Math.sqrt(dirX*dirX+dirZ*dirZ);if(len>0){dirX/=len;dirZ/=len;}isMoving=true;}
          else if(Math.abs(joyInput.x)>0.05||Math.abs(joyInput.z)>0.05){targetPosition=null;dirX=joyInput.x;dirZ=joyInput.z;isMoving=true;}
          else if(targetPosition){const dir=targetPosition.subtract(playerCollider.position);dir.y=0;const dist=dir.length();if(dist>0.5){dir.normalize();dirX=dir.x;dirZ=dir.z;isMoving=true;}else{targetPosition=null;}}
          if(isMoving){
            const cs=Math.sqrt(dirX*dirX+dirZ*dirZ)*speed; moveVec.x=dirX*speed; moveVec.z=dirZ*speed;
            const ta=Math.atan2(dirX,dirZ); playerVisual.rotation.y=BABYLON.Scalar.LerpAngle(playerVisual.rotation.y,ta,0.2);
            walkCycle+=cs*1.5; const swing=Math.sin(walkCycle)*(Math.PI/4);
            stickmanRig.leftHip.rotation.x=swing; stickmanRig.rightHip.rotation.x=-swing; stickmanRig.leftShoulder.rotation.x=-swing; stickmanRig.rightShoulder.rotation.x=swing;
            stickmanRig.torso.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.torso.rotation.x,Math.PI/16,0.1);
            stickmanRig.torso.position.y=1.8+Math.abs(Math.sin(walkCycle*2))*0.15;
            particleSystem.emitRate=Math.abs(Math.sin(walkCycle*2))<0.2?40:0;
          } else {
            stickmanRig.leftHip.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.leftHip.rotation.x,0,0.1);
            stickmanRig.rightHip.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.rightHip.rotation.x,0,0.1);
            stickmanRig.leftShoulder.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.leftShoulder.rotation.x,0,0.1);
            stickmanRig.rightShoulder.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.rightShoulder.rotation.x,0,0.1);
            stickmanRig.torso.rotation.x=BABYLON.Scalar.Lerp(stickmanRig.torso.rotation.x,0,0.1);
            stickmanRig.torso.position.y=BABYLON.Scalar.Lerp(stickmanRig.torso.position.y,1.8,0.1);
            particleSystem.emitRate=0;
          }
          playerCollider.moveWithCollisions(moveVec);
          if(BABYLON.Vector3.Distance(playerCollider.position,bossPosition)<5){
            isAtBoss=true; isAtBossRef.current=true; isMazeActive=false; isMazeActiveRef.current=false;
            if(joyWrapRef.current) joyWrapRef.current.style.display='none'; setInstruction('');
            const fa=Math.atan2(bossPosition.x-playerCollider.position.x,bossPosition.z-playerCollider.position.z); playerVisual.rotation.y=fa;
            stickmanRig.torso.rotation.x=0; stickmanRig.leftHip.rotation.x=0; stickmanRig.rightHip.rotation.x=0;
            setMazeScreen('puzzle');
          }
        });

        return s;
      };

      (async () => {
        scene = await createScene();
        sceneRef.current = scene;
        engine.runRenderLoop(() => { if (scene) scene.render(); });
      })();

      const handleResize = () => { if (engine) engine.resize(); };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (engine) { engine.stopRenderLoop(); engine.dispose(); }
      };
    } catch (e) {
      console.warn('Babylon 3D Engine failed to load.', e);
    }
  }, [playSfx, updateXP, exitMaze]);

  const t = LANG[currentLang];

  return (
    <div id="maze-container" style={{display:'block'}}>
      <canvas ref={canvasRef} id="renderCanvas"></canvas>
      <div ref={joyWrapRef} id="joystick-wrapper" style={{display:'none'}}>
        <canvas ref={joyCanvasRef} id="joystick-canvas" width="150" height="150"></canvas>
      </div>

      <div id="content-wrapper">
        <div className="maze-topbar glass-panel">
          <div className="brand">
            <div className="xp-pill" style={{background:'var(--amber)',boxShadow:'0 0 10px var(--amber-ring)',minWidth:'80px',textAlign:'center'}}>
              ⚡ {globalXP} XP
            </div>
            <div>
              <div className="brand-name">THE CORE</div>
              <div className="brand-sub">Martian Sector</div>
            </div>
          </div>
          <button className="btn-hub" onClick={handleExitToHub}>{t.exitHub}</button>
        </div>

        {instruction && (
          <div id="floating-instruction">{instruction}</div>
        )}

        {mazeScreen === 'puzzle' && (
          <div className="maze-screen glass-panel active">
            <div className="hero-title">Core Firewall</div>
            <div className="hero-sub">Cognitive Override Required.<br />What is the primary gateway domain to the mind?</div>
            <input type="text" id="puzzle-answer" className="puzzle-input" placeholder="Enter Domain Name..." />
            <button className="btn-cta" onClick={checkPuzzle}>Submit Override</button>
          </div>
        )}

        {mazeScreen === 'victory' && (
          <div className="maze-screen glass-panel active">
            <div className="hero-title">Core Unlocked</div>
            <div className="hero-sub">Data secured. Memory fragments uploaded successfully.</div>
            <button className="btn-cta" onClick={() => { exitMaze(); setMazeScreen('none'); }}>Return to Orbit</button>
          </div>
        )}
      </div>
    </div>
  );
}
