console.log('👋🏻 hello from Hugo and imgios!');

document.addEventListener("DOMContentLoaded", function () {
    const checkboxes = document.querySelectorAll("input[type='checkbox']");
    checkboxes.forEach(cb => {
      cb.disabled = false; // Make them clickable
  
      // Save state
      cb.addEventListener("change", () => {
        const key = cb.id || cb.nextSibling.textContent.trim();
        localStorage.setItem(key, cb.checked);
      });
  
      // Restore state
      const key = cb.id || cb.nextSibling.textContent.trim();
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        cb.checked = saved === "true";
      }
    });
  });