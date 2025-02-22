(function(){
    const fonts=["cursive","sans-serif","monospace","fantasy","serif"];
    let captchaValue="";
    function generateCaptcha(){
        let value=btoa(Math.random()*1000000000);
        value=value.substr(0.5+Math.random()*5);
        captchaValue=value;
    }
    function setCaptch(){
        let html=captchaValue.split("").map((char)=>{
            const rotate=-20+Math.trunc(Math.random()*30);
            const font=Math.trunc(Math.random()*fonts.length);
            return `<span
                style="
                    transform:rotate(${rotate}deg);
                    font-family:${fonts[font]};
            >${char}</span>`;
        }).join("");
        document.querySelector(".preview").innerHTML=html;
    }
    function initCaptcha(){
        document.querySelector(".captcha-form .captcha-refresh").addEventListener("click", () => {
            generateCaptcha();
            setCaptch();
        });
        generateCaptcha();
        setCaptch();
    }
    initCaptcha();

    document.querySelector(".btn").addEventListener("click", function() {
        let inputCaptchaValue=document.querySelector(".captcha-input").value;
        if(inputCaptchaValue===captchaValue){
            let username=document.querySelector(".username").value;
            let password=document.querySelector(".password").value;
            let email=document.querySelector(".email").value;
            let data={
                username:username,
                password:password,
                email:email
            };
            fetch("/register", {
                method:"POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }).then((response)=>{
                return response.json();
            }).then((data)=>{
                if(data.error){
                    alert(data.error);
                }else{
                    alert("User registered successfully");
                    window.location.href="/login";
                }
            });
            // swal("","Logging In","success");
        }
        else{
            swal("","Invalid Captcha","error");
        }
    });
})();
