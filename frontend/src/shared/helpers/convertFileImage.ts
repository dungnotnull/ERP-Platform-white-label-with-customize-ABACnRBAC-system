export const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject("Unable to convert file to base64");
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const convertBase64ToImage = (
  base64: string,
  fileName: string
): File => {
  if (!base64) {
    return new File([], fileName);
  }

  const base64Data = base64.replace(/^data:.+;base64,/, "");
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });

  const file = new File([blob], fileName, { type: "image/png" });
  return file;
};
