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
            alert("Compilare i campi obbligatori")
        }
        else {
            const request = await inviaRichiesta("POST", "/api/login", { email, password, codice });
            if (request.status == 200) {
                alert("Login effettuato");
                const userId = request.data.id;

                if (codice == "students" || codice == "teachers") {
                    sessionStorage.setItem("codice", codice);
                    localStorage.setItem("userId", userId);
                    window.location.href = "./index.html";
                }
                else if (codice == "admin") {
                    window.location.href = "./admin.html"
                }
            }
        }
    })

    btnInfoMaterie.on("click", function () {
        getMaterie()
    })


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
            alert("Il nome non può essere vuoto.");
            return;
        }

        if (cognome === "") {
            alert("Il cognome non può essere vuoto.");
            return;
        }

        if (!emailRegex.test(email)) {
            alert("Inserisci un'email valida.");
            return;
        }

        if (!passwordRegex.test(password)) {
            alert("La password deve essere di almeno 8 caratteri, contenere almeno un numero e un carattere speciale.");
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

    });

    document.getElementById("btnRegisterTeacher").addEventListener("click", async function (e) {
        const nome = document.getElementById("name-teacher").value.trim();
        const cognome = document.getElementById("cognome-teacher").value.trim();
        const email = document.getElementById("email-teacher").value.trim();
        const citta = document.getElementById("residenza").value.trim();
        const presenza = document.getElementById("presenza").checked;
        const online = document.getElementById("online").checked;
        const difficolta = document.getElementById("difficolta").checked;
        const materia = document.getElementById("materia").value.trim();
        const prefix = document.getElementById("prefix").value.trim();
        const phoneNumber = document.getElementById("phone-teacher").value.trim();
        const fullPhone = prefix + phoneNumber.replace(/\s+/g, '');
        const cvFile = document.getElementById("cv-upload").files[0];

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (!nome) {
            alert("Il nome non può essere vuoto.");
            return;
        }
        if (!cognome) {
            alert("Il cognome non può essere vuoto.");
            return;
        }
        if (!emailRegex.test(email)) {
            alert("Inserisci un'email valida.");
            return;
        }
        if (!citta) {
            alert("La città non può essere vuota.");
            return;
        }

        let scelte = [];
        if (!presenza && !online) {
            e.preventDefault();
            alert("Seleziona almeno una disponibilità");
            return;
        } else {
            if (presenza) scelte.push("Presenza");
            if (online) scelte.push("Online");
            if (difficolta) scelte.push("Difficolta");
            console.log(scelte.join(", "));
        }

        if (!materia) {
            alert("La materia non può essere vuota.");
            return;
        }
        const phoneDigits = phoneNumber.replace(/\D/g, '');
        if (phoneDigits.length !== 10) {
            alert("Il numero di telefono deve contenere esattamente 10 cifre");
            return;
        }

        if (!cvFile) {
            alert("Per favore carica il CV");
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

            console.log(account);

            const request = await inviaRichiesta("POST", "/api/creaRichiestaProfessore", { account });
            if (request.data) {
                console.log("Account creato:", account);
            } else {
                alert("Errore durante la registrazione.");
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
            Swal.fire({
                title: 'Materie',
                html: `<div id="divMaterie"><p>Le materie disponibili sono le seguenti:</p></div><br><br>`,
                icon: "info",
                customClass: {
                    popup: 'swal-materie-popup',
                    title: 'swal-materie-title',
                    htmlContainer: 'swal-materie-html'
                },
                didOpen: () => {
                    const ul = $("<ul>").appendTo("#divMaterie").css({
                        'display': 'flex',
                        'flex-wrap': 'wrap',
                        'list-style-type': 'none',
                        'padding': '0',
                        'margin': '0',
                        'gap': '15px',
                    });

                    request.data.forEach(materia => {
                        $("<li>").text(materia)
                            .css({
                                'font-size': '16px',
                                'color': '#333',
                                'margin-bottom': '8px',
                                'font-family': '"Segoe UI", sans-serif',
                                'position': 'relative',
                                'padding': '15px',
                                'width': '15%',
                                'box-sizing': 'border-box',
                                'border': '1px solid #ddd',
                                'border-radius': '10px',
                            })
                            .prepend('<i class="fa fa-check-circle" style="position:absolute; left:0; top:0; color:#4caf50; font-size:18px;"></i>')
                            .appendTo(ul);
                    });
                }
            });
        }
    }
})