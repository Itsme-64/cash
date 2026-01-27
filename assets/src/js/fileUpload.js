const uploadButton = document.getElementById('upload-btn');
const filenameDisplay = document.getElementById('file-name-display');

uploadButton.addEventListener('click', () => {
    fileInput.click(); // trigger hidden file input
});

fileInput.addEventListener('change', () => {
    const fileName = fileInput.files[0]?.name || '';
    filenameDisplay.value = fileName;
    if (fileInput.files.length > 1) {
        filenameDisplay.value += ` + ${fileInput.files.length - 1} more file(s)`
    }
});