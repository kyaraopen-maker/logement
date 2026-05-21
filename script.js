// On récupère dynamiquement la connexion globale initialisée dans le HTML
let dbClient = window.supabase;

// Tableau local qui va stocker temporairement les logements récupérés
let logements = [];

// --- LOGEMENTS DE SECOURS (Affichés si ta base Supabase est vide ou inaccessible) ---
const logementsSecours = [
    {
        id: 1,
        type: "Appartement",
        quartier: "Bacongo",
        prix: 150000,
        desc: "Bel appartement de 2 chambres, salon, douche interne, électricité disponible.",
        img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500",
        agent: { nom: "Agence Hiram", tel: "066000000" }
    },
    {
        id: 2,
        type: "Chambre",
        quartier: "Poto-Poto",
        prix: 50000,
        desc: "Chambre single propre, canalisée, compteur personnel, entrée indépendante.",
        img: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500",
        agent: { nom: "Hiram Architech", tel: "055000000" }
    }
];

// --- 1. CHARGEMENT DES DONNÉES DEPUIS SUPABASE ---
async function chargerLogementsDepuisServeur() {
    dbClient = window.supabase;

    if (!dbClient) {
        console.warn("Supabase indisponible, chargement des données locales.");
        logements = logementsSecours;
        afficherLogements(logements);
        return;
    }

    try {
        const { data, error } = await dbClient
            .from('logements')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            logements = data.map(l => ({
                id: l.id,
                type: l.type,
                quartier: l.quartier,
                prix: l.prix,
                desc: l.desc_texte, 
                // SI TU VOIS CETTE IMAGE DE CHANTIER (CASQUE), C'EST QUE L'IMAGE N'EST PAS BIEN ARRIVÉE EN BASE !
                img: l.img || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500",
                agent: {
                    nom: l.agent_nom || "Anonyme",
                    tel: l.agent_tel || "066000000"
                }
            }));
        } else {
            console.log("La table Supabase est vide. Affichage des exemples.");
            logements = logementsSecours;
        }
    } catch (err) {
        console.error("Erreur de connexion, bascule sur le secours :", err);
        logements = logementsSecours;
    }

    afficherLogements(logements);
}

// --- 2. GESTION DU VERROU DE PAIEMENT UNIQUE (300 F) ---
const btnPayAccess = document.getElementById('btn-pay-access');

if (btnPayAccess) {
    btnPayAccess.addEventListener('click', () => {
        CinetPay.setConfig({
            apikey: 'TA_CLE_API_CINETPAY', // Remplace par ta clé API trouvée sur ton dashboard CinetPay
            site_id: 'TON_SITE_ID',       // Remplace par ton Site ID
            notify_url: 'http://ton-site.com/notify',
            mode: 'PRODUCTION'            // Utilise 'TEST' pour commencer
        });

        CinetPay.getCheckout({
            transaction_id: Math.floor(Math.random() * 1000000).toString(),
            amount: 300,
            currency: 'XAF',
            channels: 'MOBILE_MONEY', // Active MTN et Airtel Money automatiquement
            description: 'Accès à vie Brazza Logement',
        });

        CinetPay.waitResponse(function(data) {
            if (data.status == "REFUSED") {
                alert("Paiement refusé : " + data.message);
            } else if (data.status == "ACCEPTED") {
                alert("Paiement réussi ! Bienvenue sur Brazza Logement.");
                // Cacher l'overlay
                document.getElementById('payment-overlay').style.display = 'none';
            }
        });
    });
}

// --- 3. GESTION DE LA NAVIGATION BASSE ---
const navItems = document.querySelectorAll('.nav-item');
const screens = document.querySelectorAll('.screen');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        screens.forEach(screen => screen.classList.remove('active'));
        const targetScreen = item.getAttribute('data-screen');
        const screenElement = document.getElementById(targetScreen);
        if (screenElement) screenElement.classList.add('active');
    });
});

// --- 4. AFFICHAGE DES LOGEMENTS ---
const container = document.getElementById('logements-container');

function afficherLogements(liste) {
    if (!container) return;
    container.innerHTML = ""; 

    if(liste.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray; margin-top:20px;">Aucun logement trouvé.</p>`;
        return;
    }

    liste.forEach(logement => {
        const card = document.createElement('div');
        card.className = 'logement-card';
        card.innerHTML = `
            <img src="${logement.img}" class="logement-img" alt="Photo logement" style="cursor:pointer;" onclick="ouvrirDetails(${logement.id})">
            <div class="logement-info">
                <div class="logement-header">
                    <span class="logement-tag">${logement.type}</span>
                    <span class="logement-price">${logement.prix.toLocaleString()} FCFA</span>
                </div>
                <div class="logement-quartier"><i class="fa-solid fa-location-dot" style="color:#2563eb;"></i> ${logement.quartier}</div>
                <p class="logement-desc">${logement.desc}</p>
                <small style="color:#2563eb; display:block; margin-top:10px; font-weight:600; cursor:pointer;" onclick="ouvrirDetails(${logement.id})">
                    <i class="fa-solid fa-eye"></i> Cliquez sur l'image pour voir le contact
                </small>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 5. OUVERTURE DE LA MODALE DÉTAILS ---
const modal = document.getElementById('details-modal');
const closeModal = document.querySelector('.close-modal');

function ouvrirDetails(id) {
    const maison = logements.find(l => l.id === id);
    if(!maison || !modal) return;

    document.getElementById('modal-img').src = maison.img;
    document.getElementById('modal-tag').innerText = maison.type;
    document.getElementById('modal-price').innerText = `${maison.prix.toLocaleString()} FCFA`;
    document.getElementById('modal-quartier').innerHTML = `<i class="fa-solid fa-location-dot" style="color:#2563eb;"></i> ${maison.quartier}`;
    document.getElementById('modal-desc').innerText = maison.desc;
    document.getElementById('agent-name').innerText = maison.agent.nom;
    
    document.getElementById('agent-call').href = `tel:${maison.agent.tel}`;
    document.getElementById('agent-whatsapp').href = `https://wa.me/242${maison.agent.tel}?text=Bonjour, je suis intéressé par votre annonce de ${maison.type} à ${maison.quartier} sur Brazza Logement.`;

    modal.classList.remove('hidden');
}

if (closeModal) closeModal.addEventListener('click', () => modal.classList.add('hidden'));
window.addEventListener('click', (e) => { if(e.target === modal) modal.classList.add('hidden'); });

// --- 6. FILTRE ET RECHERCHE ---
const searchInput = document.getElementById('search-input');
const filterType = document.getElementById('filter-type');

function filtrer() {
    if (!searchInput || !filterType) return;
    const texte = searchInput.value.toLowerCase().trim();
    const typeSelectionne = filterType.value;

    const resultat = logements.filter(logement => {
        const correspondQuartier = logement.quartier.toLowerCase().includes(texte);
        const correspondType = (typeSelectionne === "tous") || (logement.type === typeSelectionne);
        return correspondQuartier && correspondType;
    });
    afficherLogements(resultat);
}
if (searchInput) searchInput.addEventListener('input', filtrer);
if (filterType) filterType.addEventListener('change', filtrer);

// --- 7. ENVOI RÉEL DE L'ANNONCE SUR SUPABASE ---
const addForm = document.getElementById('add-logement-form');

if (addForm) {
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        dbClient = window.supabase;

        const type = document.getElementById('new-type').value;
        const quartier = document.getElementById('new-quartier').value;
        const prix = parseInt(document.getElementById('new-loyer').value);
        const desc = document.getElementById('new-desc').value;

        if (!dbClient) {
            alert("Supabase indisponible. Enregistrement local.");
            return;
        }

        const agentNomEl = document.getElementById('new-agent-nom');
        const agentTelEl = document.getElementById('new-agent-tel');
        const nomAuteur = agentNomEl ? agentNomEl.value : "Anonyme";
        const telAuteur = agentTelEl ? agentTelEl.value : "066000000";
        
        const photoInput = document.getElementById('new-photo');
        const photoFile = photoInput && photoInput.files ? photoInput.files[0] : null;

        // Image par défaut si AUCUN fichier n'est sélectionné
        let finalImgUrl = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500";

        // Traitement de la photo si elle existe
        if (photoFile && dbClient.storage) {
            const nomUniqueFichier = `${Date.now()}_${photoFile.name.replace(/\s+/g, '_')}`;
            console.log("Tentative d'upload de la photo :", nomUniqueFichier);

            const { data: uploadData, error: uploadError } = await dbClient.storage
                .from('photos-logements')
                .upload(nomUniqueFichier, photoFile);

            if (uploadError) {
                console.error("Erreur Storage Supabase :", uploadError);
                alert(`Erreur Storage : ${uploadError.message}`);
            } else {
                const { data: linkData } = dbClient.storage
                    .from('photos-logements')
                    .getPublicUrl(nomUniqueFichier);
                
                if (linkData && linkData.publicUrl) {
                    finalImgUrl = linkData.publicUrl;
                    console.log("Image ajoutée avec succès :", finalImgUrl);
                }
            }
        }

        // Insertion en base de données
        const { error: insertError } = await dbClient
            .from('logements')
            .insert([
                {
                    type: type,
                    quartier: quartier,
                    prix: prix,
                    desc_texte: desc,
                    img: finalImgUrl, // L'URL de TA photo va ici !
                    agent_nom: nomAuteur,
                    agent_tel: telAuteur  
                }
            ]);

        if (insertError) {
            console.error("Erreur insertion table :", insertError);
            alert(`Erreur insertion : ${insertError.message}`);
            return;
        }

        addForm.reset();
        await chargerLogementsDepuisServeur();

        setTimeout(() => {
            alert("Génial ! Votre annonce a été publiée avec succès !");
            document.querySelector('[data-screen="screen-accueil"]').click();
        }, 200);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    chargerLogementsDepuisServeur();
});