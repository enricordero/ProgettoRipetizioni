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

    document.getElementById("btnRegisterTeacher").addEventListener("click", async function (e) {
        const presenza = document.getElementById("presenza").checked;
        const online = document.getElementById("online").checked;
        const difficolta = document.getElementById("difficolta").checked;

        let scelte = [];
        if (!presenza && !online) {
            e.preventDefault();
            alert("Seleziona almeno una disponibilità");
        } else {
            if (presenza) scelte.push("Presenza");
            if (online) scelte.push("Online");
            if (difficolta) scelte.push("Difficolta");

            console.log(scelte.join(", "));
        }

        const nome = document.getElementById("name-teacher").value;
        const cognome = document.getElementById("cognome-teacher").value;
        const email = document.getElementById("email-teacher").value;
        const citta = document.getElementById("residenza").value;
        const materia = document.getElementById("materia").value;
        const prefix = document.getElementById("prefix").value;
        const phoneNumber = document.getElementById("phone-teacher").value;
        const fullPhone = prefix + phoneNumber.replace(/\s+/g, '');
        const cvFile = document.getElementById("cv-upload").files[0];

        if (!nome || !cognome || !email || !citta || !materia || !cvFile) {
            alert("Per favore, compila tutti i campi obbligatori.");
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
                "telefono": fullPhone,
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