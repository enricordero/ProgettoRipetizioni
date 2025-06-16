"use strict"

$(document).ready(function () {
    const aRegisterStudent = $("#register-student")
    const aRegisterTeacher = $("#register-teacher")
    const aLogin = $(".login")
    const loginSection = $("#login-section").show()
    const registerSectionTeacher = $("#register-section-teacher").hide()
    const registerSectionStudent = $("#register-section-student").hide()
    const btnAccedi = $("#btnLogin")
    const btnInfoMaterie = $("#infoMaterieBtn")

    btnAccedi.on("click", async function () {
        let email = $("#loginEmail").val()
        let password = $("#loginPassword").val()
        let codice = $('#tipoUtente option:selected').data('codice')
        console.log(codice)
        if (!email || !password) {
            Swal.fire({
                title: "Attenzione",
                text: "Compilare tutti i campi!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
        }
        else {
            const request = await inviaRichiesta("POST", "/api/login", { email, password, codice });
            if (request.status == 200) {
                const userId = request.data.id;
                sessionStorage.setItem("codice", codice);
                localStorage.setItem("userId", userId);

                Swal.fire({
                    title: "Login effettuato",
                    icon: "success",
                    confirmButtonText: "Ok",
                }).then(() => {
                    if (codice == "students" || codice == "teachers") {
                        window.location.href = "./index.html";
                    }
                    else if (codice == "admin") {
                        window.location.href = "./admin.html"
                    }
                })
            }
        }
    })

    $('#mySelect').select2({
        placeholder: "Scegli una o più materie",
        width: 'resolve'
    });

    getMaterie()

    $('#seeMat').on('click', function () {
        const selectedValues = $('#mySelect').val();

        if (selectedValues && selectedValues.length > 0) {
            console.log("Hai selezionato: " + selectedValues.join(", "));
        } else {
            console.log("Nessuna materia selezionata");
        }
    });

    aLogin.on("click", function () {
        loginSection.show()
        registerSectionStudent.hide()
        registerSectionTeacher.hide()
    })

    aRegisterTeacher.on("click", function () {
        loginSection.hide()
        registerSectionTeacher.show()
        registerSectionStudent.hide()
    })

    aRegisterStudent.on("click", function () {
        loginSection.hide()
        registerSectionTeacher.hide()
        registerSectionStudent.show()
    })

    $("#cv-upload").on("change", function () {
        const file = this.files[0];
        if (file && file.type !== "application/pdf") {
            Swal.fire({
                title: "Errore",
                text: "Il formato del CV non è valido!",
                footer: "Formati consentiti: .pdf",
                icon: "error"
            });
            $(".file-label").text("Inserisci il tuo CV *")
                .css("color", "#687aff")
            this.value = "";
        } else if (file && file.type == "application/pdf") {
            $(".file-label").text("PDF caricato correttamente: " + file.name)
                .css({
                    "color": "green",
                    "text-decoration": "none"
                })
        }
    })

    document.getElementById("btnRegisterStudent").addEventListener("click", async function () {
        const nome = document.getElementById("nome-studente").value.trim();
        const cognome = document.getElementById("cognome-studente").value.trim();
        const email = document.getElementById("email-studente").value.trim();
        const password = document.getElementById("password-studente").value;

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;

        if (nome === "") {
            Swal.fire({
                title: "Attenzione",
                text: "Il nome non può essere vuoto!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        if (cognome === "") {
            Swal.fire({
                title: "Attenzione",
                text: "Il cognome non può essere vuoto!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        if (!emailRegex.test(email)) {
            Swal.fire({
                title: "Attenzione",
                text: "Inserisci un email valida!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        if (!passwordRegex.test(password)) {
            Swal.fire({
                title: "Attenzione",
                text: "La password deve contenere almeno 8 caratteri, di cui almeno un numero e un carattere speciale",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        const account = {
            nome: nome,
            cognome: cognome,
            email: email,
            password: password
        };

        const request = await inviaRichiesta("POST", "/api/creaUtenteStudente", { account })
        if (request.status == 200) {
            console.log("Account studente creato con successo!");

            const alertBox = document.getElementById("successAlert");
            alertBox.style.display = "block";
            alertBox.style.opacity = "0.8";

            setTimeout(() => {
                alertBox.style.opacity = "0";
                alertBox.addEventListener("transitionend", () => {
                    alertBox.style.display = "none";
                }, { once: true });
            }, 3000);

            loginSection.show();
            registerSectionStudent.hide();
            registerSectionTeacher.hide();
        }
        else if (request.status == 400) {
            Swal.fire({
                title: "Email già in uso",
                text: "L'email inserita è già associata a un account.",
                icon: "error",
                confirmButtonText: "Ok",
            })
        }

    });

    document.getElementById("btnRegisterTeacher").addEventListener("click", async function (e) {
        const nome = document.getElementById("name-teacher").value.trim();
        const cognome = document.getElementById("cognome-teacher").value.trim();
        const email = document.getElementById("email-teacher").value.trim();
        const citta = document.getElementById("residenza").value.trim();
        const presenza = document.getElementById("presenza").checked;
        const online = document.getElementById("online").checked;
        const difficolta = document.getElementById("difficolta").checked;

        let materia
        const selectedValues = $('#mySelect').val();
        if (selectedValues && selectedValues.length > 0) {
            materia = selectedValues.join(", ");
        } else {
            Swal.fire({
                title: "Nessuna materia selezionata",
                text: "Devi selezionare almeno una materia per poter procedere con la registrazione",
                icon: "warning",
                confirmButtonText: "Ok",
            })
        }
        const prefix = document.getElementById("prefix").value.trim();
        const phoneNumber = document.getElementById("phone-teacher").value.trim();
        const fullPhone = prefix + phoneNumber.replace(/\s+/g, '');
        const cvFile = document.getElementById("cv-upload").files[0];

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!nome) {
            Swal.fire({
                title: "Attenzione",
                text: "Il nome non può essere vuoto!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }
        if (!cognome) {
            Swal.fire({
                title: "Attenzione",
                text: "Il cognome non può essere vuoto!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }
        if (!emailRegex.test(email)) {
            Swal.fire({
                title: "Attenzione",
                text: "Inserisci un email valida!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }
        if (!citta) {
            Swal.fire({
                title: "Attenzione",
                text: "La città non può essere vuota!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        let scelte = [];
        if (!presenza && !online) {
            e.preventDefault();
            Swal.fire({
                title: "Attenzione",
                text: "Seleziona almeno una disponibilità tra online e presenza!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        } else {
            if (presenza) scelte.push("Presenza");
            if (online) scelte.push("Online");
            if (difficolta) scelte.push("Difficolta");
            console.log(scelte.join(", "));
        }

        if (!materia) {
            Swal.fire({
                title: "Nessuna materia selezionata",
                text: "Devi selezionare almeno una materia per poter procedere con la registrazione!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            Swal.fire({
                title: "Attenzione",
                text: "Il numero di telefono deve contenere almeno 10 cifre!",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        if (!cvFile) {
            Swal.fire({
                title: "Attenzione",
                text: "Il CV non può essere vuoto. Assicurati di aver caricato un file in formato .pdf",
                icon: "warning",
                confirmButtonText: "Ok",
            })
            return;
        }

        try {
            const cvBase64 = cvFile ? await fileToBase64(cvFile) : null;

            const account = {
                nome,
                cognome,
                email,
                materia,
                citta,
                scelte,
                telefono: fullPhone,
                cvBase64
            };


            const request = await inviaRichiesta("POST", "/api/creaRichiestaProfessore", { account });
            if (request.data) {
                Swal.fire({
                    title: "Richiesta inviata",
                    text: "La tua richiesta di registrazione è stata inviata. Attendi che un admin verifichi la tua richiesta e ti invii il risultato via Whatsapp",
                    icon: "success",
                    confirmButtonText: "Ok",
                }).then(() => {
                    window.location.href = "/";
                })
            } else {
                Swal.fire({
                    title: "Errore",
                    text: "Errore inaspettato. Riprova",
                    icon: "warning",
                    confirmButtonText: "Ok",
                })
            }
        } catch (error) {
            console.error("Errore nella creazione dell'account:", error);
            alert("Errore durante la lettura dei file.");
        }
    });


    // Funzione per convertire il file in una stringa base64 senza il prefisso MIME
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            // Se il file è un'immagine
            if (file.type.startsWith("image")) {
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1]; // Rimuove il prefisso "data:image/*;base64,"
                    resolve(base64String);
                };
            }
            // Se il file è un PDF o altro documento
            else if (file.type === "application/pdf") {
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1]; // Rimuove il prefisso "data:application/pdf;base64,"
                    resolve(base64String);
                };
            }

            reader.onerror = (error) => reject(error);

            // Avvia la lettura del file come DataURL
            reader.readAsDataURL(file);
        });
    }

    async function getMaterie() {
        const request = await inviaRichiesta("GET", "/api/getMaterie")
        if (request.status == 200) {
            request.data.forEach(materia => {
                $("<option>").val(materia).text(materia).appendTo("#mySelect")
            });
        }
    }
})