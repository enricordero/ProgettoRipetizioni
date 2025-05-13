"use strict"

$(document).ready(function () {
    const aRegisterStudent = $("#register-student")
    const aRegisterTeacher = $("#register-teacher")
    const aLogin = $(".login")
    const loginSection = $("#login-section").show()
    const registerSectionTeacher = $("#register-section-teacher").hide()
    const registerSectionStudent = $("#register-section-student").hide()
    const btnAccedi = $("#btnLogin")
    const btnRegisterTeacher = $("#btnRegisterTeacher")
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

    const input = document.getElementById('imageInput');
    const preview = document.getElementById('preview');

    input.addEventListener('change', function () {
        const file = this.files[0];

        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };

            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
            this.value = ''; // reset input
            Swal.fire({
                title: "Errore",
                text: "Il formato dell'immagine non è valido!",
                footer: "Formati consentiti: .png, .jpg, .jpeg, .gif, .webp e .bmp",
                icon: "error"
            });
        }
    });

    document.getElementById("btnRegisterTeacher").addEventListener("click", async function () {
        const nome = document.getElementById("name-teacher").value;
        const cognome = document.getElementById("cognome-teacher").value;
        const email = document.getElementById("email-teacher").value;
        const citta = document.getElementById("residenza").value;
        const materia = document.getElementById("materia").value;

        const fotoFile = document.getElementById("imageInput").files[0];
        const cvFile = document.getElementById("cv-upload").files[0];

        if (!nome || !cognome || !email || !citta || !materia || !cvFile) {
            alert("Per favore, compila tutti i campi obbligatori.");
            return;
        }

        try {
            const fotoProfiloBase64 = fotoFile ? await fileToBase64(fotoFile) : null;
            const cvBase64 = cvFile ? await fileToBase64(cvFile) : null;

            const account = {
                nome,
                cognome,
                email,
                citta,
                materia,
                cvBase64,
                fotoProfiloBase64
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
                    popup: 'swal-materie-popup',     // La classe personalizzata per il pop-up
                    title: 'swal-materie-title',     // La classe per il titolo
                    htmlContainer: 'swal-materie-html'  // La classe per il contenitore dell'HTML
                },
                didOpen: () => {
                    // Creiamo una lista <ul> e applichiamo gli stili
                    const ul = $("<ul>").appendTo("#divMaterie").css({
                        'display': 'flex',           // Usa flexbox per gestire il layout delle colonne
                        'flex-wrap': 'wrap',         // Permette di andare a capo con le materie
                        'list-style-type': 'none',   // Rimuoviamo i pallini predefiniti
                        'padding': '0',              // Rimuoviamo il padding di default
                        'margin': '0',               // Rimuoviamo il margine predefinito
                        'gap': '15px',               // Spazio tra gli elementi
                    });

                    // Aggiungiamo ogni materia nella lista
                    request.data.forEach(materia => {
                        $("<li>").text(materia)
                            .css({
                                'font-size': '16px',                // Impostiamo la dimensione del testo
                                'color': '#333',                    // Colore del testo
                                'margin-bottom': '8px',             // Distanza tra gli elementi
                                'font-family': '"Segoe UI", sans-serif', // Font più moderno
                                'position': 'relative',             // Per posizionare un'icona
                                'padding': '15px',             // Distanza tra il testo e l'icona
                                'width': '15%',                     // Impostiamo la larghezza di ogni item (30% per 3 colonne)
                                'box-sizing': 'border-box',         // Assicura che il padding non influisca sulla larghezza totale,
                                'border': '1px solid #ddd',          // Aggiungiamo un bordo per separare l
                                'border-radius': '10px',             // Aggiungiamo un bordo arrotondato per render
                            })
                            .prepend('<i class="fa fa-check-circle" style="position:absolute; left:0; top:0; color:#4caf50; font-size:18px;"></i>') // Icona accanto al testo
                            .appendTo(ul);
                    });
                }
            });
        }
    }
})