const step1 = document.querySelector('.step1'),
  step2 = document.querySelector('.step2'),
  step3 = document.querySelector('.step3'),
  email1 = document.getElementById('email1'),
  verifyEmail = document.getElementById('verifyEmail'),
  inputs = document.querySelectorAll(".otp-group input"),
  nextBtn = document.querySelector(".nextBtn"),
  verifyBtn = document.querySelector(".verifyBtn");

let OTP;
window.addEventListener('load', () => {
  step1.style.display = 'block';
  step2.style.display = 'none';
  step3.style.display = 'none';
  nextBtn.classList.add('disabled');
  verifyBtn.classList.add('disabled');
  emailjs.init("pwAuFiSoSJ4SngEb6");
});

const validateEmail = (email) => {
  let re = /\S+@\S+\.\S+/;
  if (re.test(email)) {
    nextBtn.classList.remove("disabled");
  } else {
    nextBtn.classList.add("disabled");
  }
}

const generateOTP = () => {
  let otp = Math.floor(1000 + Math.random() * 9000);
  return otp;
}

inputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    const currentInput = e.target;
    const nextInput = inputs[index + 1];

    // Move to next input if a number is entered
    if (currentInput.value.length === 1 && nextInput) {
      nextInput.focus();
    }

    // Move to the verify button if the last input is filled
    if (index === inputs.length - 1 && currentInput.value.length === 1) {
      verifyBtn.focus();
    }
  });

  // Move to the previous input on backspace
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && input.value.length === 0 && index > 0) {
      inputs[index - 1].focus();
    }
  });
});


const service_id = "service_w8zdkmr";
const template_id = "template_altu5ne";
nextBtn.addEventListener('click', (event) => {
  event.preventDefault();
  OTP = generateOTP();
  nextBtn.innerHTML = "&#9889; Sending OTP";
  let templateParameter = {
    from_name: "OnlineAuction Team",
    OTP: OTP,
    message: "",
    reply_to: email1.value,
  };
  emailjs.send(service_id, template_id, templateParameter).then(
    (res) => {
      console.log(res);
      nextBtn.innerHTML = "Next &rarr;";
      step1.style.display = "none";
      step2.style.display = "block";
      step3.style.display = "none";
    },
    (err) => {
      console.log(err);
      alert("Failed to send OTP. Try again.");
    }
  );
});

verifyBtn.addEventListener('click', (event) => {
  event.preventDefault();
  let values = "";

  inputs.forEach((input) => {
    values += input.value;
  });

  if (values == OTP) {
    step1.style.display = "none";
    step2.style.display = "none";
    step3.style.display = "block";
    
    setTimeout(() => {
      fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email1.value }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = "/index";
        } else {
          alert("Invalid email or password");
        }
      })
      .catch(error => console.error("Error during login:", error));
    }, 2000);
    
  } else {
    verifyBtn.classList.add("error-shake");
    setTimeout(() => {
      verifyBtn.classList.remove("error-shake");
    }, 1000);
  }
});

function changeEmail() {
  step1.style.display = "block";
  step2.style.display = "none";
  step3.style.display = "none";
}
