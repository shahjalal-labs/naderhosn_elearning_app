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