/** Set CSS variables that need the Vite `base` path (GitHub Pages subpath). */
const b = import.meta.env.BASE_URL;
document.documentElement.style.setProperty(
  '--bg-homepage-url',
  `url('${b}Assets/Homepagebackground.png.png')`
);
