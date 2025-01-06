async function submitLoginForm(event) {
    event.preventDefault();

    const form = document.getElementById('login-form');
    const formData = new FormData(form);

    const inputs = {
        'login-email': formData.get('username'),
        'login-password': formData.get('password')
    };

    const data = new FormData();
    data.append('inputs', JSON.stringify([inputs]));

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            body: data
        });

        const result = await response.json();
        if (result.user === "logged-in!") {
            alert("Login successful!");
            // Redirect or perform other actions
            window.location.reload();
        } else if (result.wrong === "pass") {
            alert("Incorrect password.");
        } else if (result.no === "user") {
            alert("User not found.");
        } else {
            alert("An error occurred.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while logging in.");
    }
}

// Attach the submit event listener to the form
document.getElementById('login-button').addEventListener('click', submitLoginForm);






async function submitRegisterForm(event) {
    event.preventDefault();

    const form = document.getElementById('register-form');
    const formData = new FormData(form);

    const inputs = {
        'applicant-email': formData.get('applicant-email'),
        'applicant-password': formData.get('applicant-password'),
        'given_name': formData.get('given_name'),
        'family_name': formData.get('family_name')
    };

    const data = new FormData();
    data.append('inputs', JSON.stringify([inputs]));

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            body: data
        });

        const result = await response.json();
        if (result.success) {
            alert("Registration successful! Please check your email to verify your account.");
            // Redirect or perform other actions
        } else {
            alert("An error occurred during registration.");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("An error occurred while registering.");
    }
}

// Attach the submit event listener to the register button
document.getElementById('register-submit-button').addEventListener('click', submitRegisterForm);

document.getElementById('register-button').addEventListener('click', function(event) {
    event.preventDefault();
    document.querySelectorAll("#modallogin, #modallong, #modaltoggle").forEach(function(el) {
        el.style.display = "none"
    });
    document.getElementById('modalregister').style.display = "block";
    document.getElementById('modalregister').style.opacity = "1";
})