const userId = 'your_user_id'; // Replace with the actual user ID
const apiUrl = `/updateUserData/${userId}`; // Replace with the actual API URL

const formData = new FormData();
formData.append('businessName', 'Your Business Name');
formData.append('companyVision', 'Your Company Vision');
formData.append('registrationStatus', 'Registration Status');
formData.append('businessType', 'Business Type');
formData.append('businessRCNumber', 'RC Number');
formData.append('yearOfIncorporation', 'Year of Incorporation');
formData.append('businessSector', 'Business Sector');

// Replace 'fileInput' with the actual file input element in your HTML.
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];
if (file) {
  formData.append('logo', file, 'logo.jpg');
}

fetch(apiUrl, {
  method: 'PUT',
  body: formData,
})
  .then((response) => {
    if (response.status === 200) {
      return response.json();
    } else {
      throw new Error('Failed to update user data.');
    }
  })
  .then((data) => {
    console.log(data.message); // Success message
  })
  .catch((error) => {
    console.error(error);
  });
