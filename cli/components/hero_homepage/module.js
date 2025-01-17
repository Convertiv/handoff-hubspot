document.addEventListener("DOMContentLoaded", function () {
  // Select the element that will be animated
   const spanInsideH1 = document.querySelectorAll(
     ".typed-text > span"
   );
   // If there are multiple spans inside h1, animate them as a single span
   if (spanInsideH1.length > 0) {
     const combinedText = Array.from(spanInsideH1)
       .map((span) => span.textContent)
       .join(" ");
     const newSpan = document.createElement("span");
     newSpan.textContent = combinedText;
     const parent = spanInsideH1[0].parentNode;
     Array.from(spanInsideH1).forEach((span) => parent.removeChild(span));
     parent.appendChild(newSpan);
   }
   // Select the new span
   const newSpanInsideH1 = document.querySelector(
     ".typed-text > span"
   );
   // If there is a span inside h1, animate it
   if (newSpanInsideH1) {
     const words = newSpanInsideH1.textContent.split(" ");
     let wordIndex = 0;
     let isDeleting = false;
     let text = "";
     function typeWordDesktop() {
       const word = words[wordIndex];
       if (isDeleting)
         if (text.length === 0) {
           isDeleting = false;
           wordIndex = (wordIndex + 1) % words.length;
           setTimeout(typeWordDesktop, 100);
         } else {
           text = word.substring(0, text.length - 1);
           newSpanInsideH1.innerText = text;
           setTimeout(typeWordDesktop, 50);
         }
       else if (text.length === word.length) {
         isDeleting = true;
         setTimeout(typeWordDesktop, 500);
       } else {
         text = word.substring(0, text.length + 1);
         newSpanInsideH1.innerText = text;
         setTimeout(typeWordDesktop, 100);
       }
     }
     typeWordDesktop();
   }
 });
 