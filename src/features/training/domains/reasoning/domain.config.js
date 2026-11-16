import { tokens } from '../../../../styles/tokens';

const reasoning = {
  id: 'reasoning',
  name: 'Reasoning',
  nameAr: 'الاستدلال',
  short: 'RSN',
  glyph: 'ᛉ',
  color: tokens.domain.reasoning,
  desc: 'Build logical reasoning, planning, and step-by-step problem solving.',
  descAr: 'بنِّ الاستدلال المنطقي والتخطيط وحل المشكلات خطوة بخطوة.',
  subs: [
    {
      id: 'logical',
      name: 'Block Escape',
      nameAr: 'هروب القطع',
      blurb: 'Plan block moves to clear a path to the exit.',
      blurbAr: 'خطّط لتحريك القطع لإفساح طريق نحو المخرج.',
      gameCount: 2,
      progress: 0,
      gameKey: 'rush-hour',
      tier: 'free',
      loader: () => import('./games/rush-hour'),
    },
    {
      /*
       * Took Matrix Reasoning's slot on 2026-08-20. Raven's matrices measure
       * whether you SPOT a pattern already laid out; nothing you do changes what
       * you are shown. The Gate measures the other half of induction — finding a
       * rule by TESTING for it — which the domain had nowhere to put. See
       * games/raven-matrices/BENCHED.md.
       */
      id: 'problem',
      name: 'The Gate',
      nameAr: 'البوابة',
      blurb: 'Probe the travellers, work out the gate’s secret law, send the one who passes.',
      blurbAr: 'افحص المسافرين، استنتج قانون البوابة السرّي، وأرسل من يعبر.',
      gameCount: 2,
      progress: 0,
      gameKey: 'gatekeeper',
      tier: 'free',
      loader: () => import('./games/gatekeeper'),
    },
    {
      id: 'planning',
      name: 'Detective',
      nameAr: 'المحقّق',
      blurb: 'One of them is lying. Read the statements and work out who did it.',
      blurbAr: 'أحدهم يكذب. اقرأ الإفادات واستنتج من الفاعل.',
      gameCount: 1,
      progress: 0,
      gameKey: 'detective',
      tier: 'free',
      loader: () => import('./games/detective'),
    },
    { id: 'causal', name: 'Causal Reasoning', gameCount: 1, progress: 0, tier: 'free' },
  ],
};

export default reasoning;
