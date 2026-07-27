/**
 * Home page filmstrip — shows the most recent photos from the
 * same data/photos.json file the gallery page uses, so there's
 * only one place to add new photos.
 */

(async function loadFilmstrip() {
  const strip = document.getElementById("home-filmstrip");
  if (!strip) return;

  try {
    const response = await fetch("data/photos.json");
    if (!response.ok) throw new Error("Request failed with " + response.status);
    const data = await response.json();

    const recent = data
      .slice()
      .sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return b.id.localeCompare(a.id, undefined, { numeric: true });
      })
      .slice(0, 8);

    strip.innerHTML = recent
      .map(
        (photo) => `
        <a href="gallery.html" title="${photo.title}">
          <img src="${photo.thumbnail}" alt="${photo.title}, ${photo.location}" loading="lazy" />
        </a>`
      )
      .join("");
  } catch (err) {
    strip.innerHTML = `<p class="gallery-error">Couldn't load recent photos (${err.message}).</p>`;
  }
})();