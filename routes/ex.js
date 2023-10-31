
const imageElement = document.getElementById("uploaded-image");
const imageInput = document.getElementById("imageInput");
const headerX = document.getElementById("headerX");
const headerXX = document.getElementById("headerXX");
const headerXXX = document.getElementById("headerXXX");
const headerY = document.getElementById("headerY");
// const file = imageElement.files[0];

// const imageRef = storage.ref("" + file.name);
// const uploadTask = imageRef.put(file);

imageElement.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.includes("image")) {
    displayImage(file);
  }
});

function displayImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    imageElement.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

document.getElementById("previewAndSave").addEventListener("click", () => {
  

  event.preventDefault();
  console.log("we");
  const imageUrl = imageElement.src;
  const header = headerX.value;
  const readTime = headerXX.value;
  const publisher = headerXXX.value;
  const content = headerY.value;
 
  const file = imageInput.files[0];
  console.log(file,header, readTime, publisher, content)

if (!imageUrl || !header || !readTime || !publisher || !content){
console.log(file,header, readTime, publisher, content)

Swal.fire({
    title: 'Empty Fill',
    text: 'Please fill all inputs.',
  
   }
    );
}
else{

function submitForm() {
  var button = document.getElementById("previewAndSave");

    // Disable the button
    button.disabled = true;

    // Change the button text to "Loading..."
    button.innerHTML = "Loading...";

    // Here, you can add your code to submit the form or perform any other action
    // For example, you can use AJAX to submit data to the server and then reset the button when the operation is complete.
    // You may also want to handle errors and reset the button in case of failure.

    // For demonstration purposes, we'll simulate a delay and then reset the button after 3 seconds.
    setTimeout(function() {
        // Re-enable the button
        button.disabled = false;
        
        // Change the button text back to "Save"
        button.innerHTML = "Save";
    }, 3000000000000); // 3-second delay (you can adjust this as needed)
}
submitForm()

  const imageRef = storage.ref("" + file.name);

const uploadTask = imageRef.put(file);

imageRef.put(file).then(snapshot => {

snapshot.ref.getDownloadURL().then(imageUrl => {
const draft = 0;
function saveDataToFirestore(imageUrl, header, readTime, publisher, content) {
return firebase.database().ref('blogPosts').push({
  imageUrl: imageUrl,
  header: header,
  readTime: readTime,
  publisher: publisher,
  content: content,
  draft: draft
})
.then(() => {
  // Show a success message using Swal.fire
  
  // Redirect to a new page after the message is displayed
  window.location.href = 'draft.html';
})
.catch(error => {
  // Handle any errors that might occur during data saving
  console.error('Error saving data:', error);
});
}

// Example usage
saveDataToFirestore(imageUrl, header, readTime, publisher, content);

});

});

}


});
function logout() {
          // Sign out the user from Firebase
          firebase.auth().signOut().then(function() {
              // Sign-out successful.
              window.location.href = 'loginblog.html';
              // You can redirect to another page or perform additional actions here if needed.
          }).catch(function(error) {
              // An error happened.
              console.error('Error signing out:', error);
          });
      }
