(() => {
  // <stdin>
  console.log("\u{1F44B}\u{1F3FB} hello from Hugo and imgios!");
  document.addEventListener("DOMContentLoaded", function() {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach((cb) => {
      cb.disabled = false;
      cb.addEventListener("change", () => {
        const key2 = cb.id || cb.nextSibling.textContent.trim();
        localStorage.setItem(key2, cb.checked);
      });
      const key = cb.id || cb.nextSibling.textContent.trim();
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        cb.checked = saved === "true";
      }
    });
  });
})();
