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

inputs.forEach((input) => {
  input.addEventListener("keyup", function (e) {
    if (this.value.length >= 1) {
      e.target.value = e.target.value.substr(0, 1);
    }

    if (inputs[0].value != "" && inputs[1].value != "" && inputs[2].value != "" && inputs[3].value != "") {
      verifyBtn.classList.remove("disabled");
    } else {
      verifyBtn.classList.add("disabled");
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
      window.location.href = "/index";
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
