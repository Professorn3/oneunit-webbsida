/**
 * Komprimerar och konverterar en bildfil från telefon eller dator till Base64.
 * Gör att bilderna snabbt kan laddas upp och sparas direkt i Firestore utan serverkrångel.
 * 
 * @param {File} file - Bildfilen från `<input type="file" />`
 * @param {number} maxDimension - Max bredd eller höjd i pixlar (t.ex. 800)
 * @param {number} quality - JPEG komprimeringskvalitet (0.0 till 1.0, standard 0.75)
 * @returns {Promise<string>} - Base64 Data URL
 */
export function compressImage(file, maxDimension = 800, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error("Ogiltig filtyp. Endast bilder är tillåtna."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skalera ner om bilden är större än maxDimension
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Rita ut bilden med mjuk rendering
        ctx.drawImage(img, 0, 0, width, height);

        // Konvertera till kompakt JPEG base64
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(new Error("Kunde inte läsa in bilden."));
    };
    reader.onerror = (err) => reject(new Error("Kunde inte läsa filen."));
  });
}
