function uploadImage() {
    let fileInput = document.getElementById('fileUpload');
    let file = fileInput.files[0];
    let formData = new FormData();
    formData.append("file", file);

    fetch('/predict_traffic', {
        method: "POST",
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
        } else {
            document.getElementById('traffic-result').innerHTML = 
                `<p>Predicted Sign: ${data.label}</p>
                 <img src="${data.image}" width="200px">`;
        }
    })
    .catch(error => console.log(error));
}
