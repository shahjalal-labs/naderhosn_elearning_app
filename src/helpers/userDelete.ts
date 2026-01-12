export const userDelete = () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Delete Account</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
 
    * {
 
      box-sizing: border-box;
 
    }
 
    body {
 
      font-family: Arial, sans-serif;
 
      background-color: #f6f6f6;
 
      padding: 0;
 
      margin: 0;
 
    }
 
    .container {
 
      max-width: 400px;
 
      margin: 80px auto;
 
      background-color: #ffffff;
 
      padding: 30px;
 
      border-radius: 10px;
 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
 
    }
 
    h2 {
 
      color: #d32f2f;
 
      text-align: center;
 
      margin-bottom: 20px;
 
    }
 
    label {
 
      display: block;
 
      margin-bottom: 6px;
 
      font-weight: 600;
 
    }
 
    input[type="email"],
 
    input[type="password"] {
 
      width: 100%;
 
      padding: 10px;
 
      margin-bottom: 20px;
 
      border: 1px solid #ccc;
 
      border-radius: 6px;
 
      font-size: 14px;
 
    }
 
    button {
 
      width: 100%;
 
      padding: 12px;
 
      background-color: #d32f2f;
 
      color: #ffffff;
 
      border: none;
 
      border-radius: 6px;
 
      font-size: 16px;
 
      cursor: pointer;
 
      transition: background-color 0.3s ease;
 
    }
 
    button:hover {
 
      background-color: #b71c1c;
 
    }
 
    .note {
 
      font-size: 13px;
 
      color: #555;
 
      text-align: center;
 
      margin-top: 15px;
 
    }
</style>
</head>
<body>
 
<div class="container">
<h2>Delete Your Account</h2>
 
  <form onsubmit="handleDelete(event)">
<label for="email">Email</label>
<input type="email" id="email" name="email" required>
 
    <label for="password">Password</label>
<input type="password" id="password" name="password" required>
 
    <button type="submit">Confirm</button>
</form>
 
  <div class="note">
 
    This action is irreversible. Please confirm carefully.
</div>
</div>
 
<script>
 
  function handleDelete(e) {
 
    e.preventDefault();
 
    const email = document.getElementById("email").value.trim();
 
    const password = document.getElementById("password").value.trim();
 
    if (!email || !password) {
 
      alert("Please fill in both fields.");
 
      return;
 
    }
 
    const confirmed = confirm(Are you sure you want to delete the account?);
 
    if (confirmed) {
 
      // TODO: Send deletion request to server here
 
      alert("Your account has been marked for deletion.");
 
    }
 
  }
</script>
 
</body>
</html>
 
 `;
};






export const deleteData = () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Delete Account</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
 
    * {
 
      box-sizing: border-box;
 
    }
 
    body {
 
      font-family: Arial, sans-serif;
 
      background-color: #f6f6f6;
 
      padding: 0;
 
      margin: 0;
 
    }
 
    .container {
 
      max-width: 400px;
 
      margin: 80px auto;
 
      background-color: #ffffff;
 
      padding: 30px;
 
      border-radius: 10px;
 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
 
    }
 
    h2 {
 
      color: #d32f2f;
 
      text-align: center;
 
      margin-bottom: 20px;
 
    }
 
    label {
 
      display: block;
 
      margin-bottom: 6px;
 
      font-weight: 600;
 
    }
 
    input[type="email"],
 
    input[type="password"] {
 
      width: 100%;
 
      padding: 10px;
 
      margin-bottom: 20px;
 
      border: 1px solid #ccc;
 
      border-radius: 6px;
 
      font-size: 14px;
 
    }
 
    button {
 
      width: 100%;
 
      padding: 12px;
 
      background-color: #d32f2f;
 
      color: #ffffff;
 
      border: none;
 
      border-radius: 6px;
 
      font-size: 16px;
 
      cursor: pointer;
 
      transition: background-color 0.3s ease;
 
    }
 
    button:hover {
 
      background-color: #b71c1c;
 
    }
 
    .note {
 
      font-size: 13px;
 
      color: #555;
 
      text-align: center;
 
      margin-top: 15px;
 
    }
</style>
</head>
<body>
 
<div class="container">
<h2>Delete Your Data</h2>
 
  <form onsubmit="handleDelete(event)">
<label for="email">Email</label>
<input type="email" id="email" name="email" required>
 
    <label for="password">Password</label>
<input type="password" id="password" name="password" required>
 
    <button type="submit">Confirm</button>
</form>
 
  <div class="note">
 
    This action is irreversible. Please confirm carefully.
</div>
</div>
 
<script>
 
  function handleDelete(e) {
 
    e.preventDefault();
 
    const email = document.getElementById("email").value.trim();
 
    const password = document.getElementById("password").value.trim();
 
    if (!email || !password) {
 
      alert("Please fill in both fields.");
 
      return;
 
    }
 
    const confirmed = confirm(Are you sure you want to delete the account?);
 
    if (confirmed) {
 
      // TODO: Send deletion request to server here
 
      alert("Your account has been marked for deletion.");
 
    }
 
  }
</script>
 
</body>
</html>
 
 `;
};


export const privacyPolicy = () => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Privacy Policy</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * {
    box-sizing: border-box;
  }

  body {
    font-family: Arial, sans-serif;
    background-color: #f6f6f6;
    padding: 0;
    margin: 0;
  }

  .container {
    max-width: 700px;
    margin: 60px auto;
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
  }

  h3 {
    margin-top: 25px;
    margin-bottom: 10px;
    color: #444;
    font-size: 16px;
  }

  p {
    font-size: 14px;
    line-height: 1.6;
    color: #555;
    margin-bottom: 12px;
  }

  ul {
    padding-left: 18px;
    margin-bottom: 15px;
  }

  ul li {
    font-size: 14px;
    color: #555;
    margin-bottom: 8px;
  }

  .footer-note {
    margin-top: 25px;
    font-size: 13px;
    color: #777;
    text-align: center;
  }
</style>
</head>
<body>

<div class="container">
  <h2>Privacy Policy</h2>

  <p>
    Your privacy is important to us. This Privacy Policy explains how we collect,
    use, and protect your personal information when you use our services.
  </p>

  <h3>1. Information We Collect</h3>
  <p>We may collect the following information:</p>
  <ul>
    <li>Personal details such as name and email address</li>
    <li>Account and login information</li>
    <li>Usage data to improve our services</li>
  </ul>

  <h3>2. How We Use Your Information</h3>
  <p>Your information is used to:</p>
  <ul>
    <li>Provide and maintain our services</li>
    <li>Improve user experience</li>
    <li>Communicate important updates</li>
  </ul>

  <h3>3. Data Security</h3>
  <p>
    We implement appropriate security measures to protect your personal data
    from unauthorized access or disclosure.
  </p>

  <h3>4. Data Sharing</h3>
  <p>
    We do not sell or share your personal data with third parties except when
    required by law or to provide our services.
  </p>

  <h3>5. Your Rights</h3>
  <p>
    You have the right to access, update, or request deletion of your personal
    data at any time.
  </p>

  <h3>6. Changes to This Policy</h3>
  <p>
    We may update this Privacy Policy from time to time. Any changes will be
    posted on this page.
  </p>

  <div class="footer-note">
    Last updated: ${new Date().toLocaleDateString()}
  </div>
</div>

</body>
</html>`;
};
