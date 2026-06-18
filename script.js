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
        img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500", // Une seule ou plusieurs séparées par virgule
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
                // img contient maintenant la chaîne de caractères avec toutes les URLs séparées par des virgules
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
const paymentOverlay = document.getElementById('payment-overlay');
const btnPayAccess = document.getElementById('btn-pay-access');

if (btnPayAccess && paymentOverlay) {
    btnPayAccess.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        alert("Simulation CinetPay : Paiement de 300 FCFA effectué avec succès !");
        paymentOverlay.style.setProperty('display', 'none', 'important');
        paymentOverlay.style.opacity = '0';
        paymentOverlay.style.pointerEvents = 'none';
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
        // Pour l'aperçu de la carte, on récupère uniquement la PREMIÈRE image de la liste
        let premiereImage = logement.img;
        if (typeof logement.img === 'string' && logement.img.includes(',')) {
            premiereImage = logement.img.split(',')[0].trim();
        }

        const card = document.createElement('div');
        card.className = 'logement-card';
        card.innerHTML = `
            <img src="${premiereImage}" class="logement-img" alt="Photo logement" style="cursor:pointer;" onclick="ouvrirDetails(${logement.id})">
            <div class="logement-info">
                <div class="logement-header">
                    <span class="logement-tag">${logement.type}</span>
                    <span class="logement-price">${logement.prix.toLocaleString()} FCFA</span>
                </div>
                <div class="logement-quartier"><i class="fa-solid fa-location-dot" style="color:#2563eb;"></i> ${logement.quartier}</div>
                <p class="logement-desc">${logement.desc}</p>
                <small style="color:#a855f7; display:block; margin-top:10px; font-weight:600; cursor:pointer;" onclick="ouvrirDetails(${logement.id})">
                    <i class="fa-solid fa-eye"></i> Voir les photos et le contact
                </small>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 5. OUVERTURE DE LA MODALE DÉTAILS (CORRIGÉE AVEC APPEL DU CARROUSEL) ---
const modal = document.getElementById('details-modal');
const closeModal = document.querySelector('.close-modal');

function ouvrirDetails(id) {
    const maison = logements.find(l => l.id === id);
    if(!maison || !modal) return;

    // On initialise le carrousel complet avec toutes les images de cet article
    initArticleCarousel(maison.img);

    document.getElementById('modal-tag').innerText = maison.type;
    document.getElementById('modal-price').innerText = `${maison.prix.toLocaleString()} FCFA`;
    document.getElementById('modal-quartier').innerHTML = `<i class="fa-solid fa-location-dot" style="color:#2563eb;"></i> ${maison.quartier}`;
    document.getElementById('modal-desc').innerText = maison.desc;
    document.getElementById('agent-name').innerText = maison.agent.nom;
    
    document.getElementById('agent-call').href = `tel:${maison.agent.tel}`;
    document.getElementById('agent-whatsapp').href = `https://wa.me/242${maison.agent.tel}?text=Bonjour, je suis intéressé par votre annonce de ${maison.type} à ${maison.quartier} sur Vente Rapide.`;

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

// --- 7. ENVOI RÉEL MULTI-IMAGES SUR SUPABASE ---
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
        // On récupère TOUS les fichiers sélectionnés sous forme de tableau
        const photoFiles = photoInput && photoInput.files ? Array.from(photoInput.files) : [];

        let tabUrlsFinales = [];

        // Traitement de chaque photo si l'utilisateur en a sélectionné
        if (photoFiles.length > 0 && dbClient.storage) {
            console.log(`${photoFiles.length} photo(s) détectée(s). Début de l'upload...`);
            
            for (const file of photoFiles) {
                const nomUniqueFichier = `${Date.now()}_${Math.floor(Math.random() * 1000)}_${file.name.replace(/\s+/g, '_')}`;
                
                try {
                    const { data: uploadData, error: uploadError } = await dbClient.storage
                        .from('photos-logements')
                        .upload(nomUniqueFichier, file);

                    if (uploadError) {
                        console.error("Erreur d'upload pour un fichier :", uploadError);
                    } else {
                        const { data: linkData } = dbClient.storage
                            .from('photos-logements')
                            .getPublicUrl(nomUniqueFichier);
                        
                        if (linkData && linkData.publicUrl) {
                            tabUrlsFinales.push(linkData.publicUrl);
                        }
                    }
                } catch (uploadException) {
                    console.error("Exception pendant l'upload :", uploadException);
                }
            }
        }

        // Si aucune image n'a réussi à uploader ou n'a été choisie, on met une image par défaut
        let stringUrlsImages = "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500";
        if (tabUrlsFinales.length > 0) {
            // On rassemble tous les liens en une seule chaîne, séparés par des virgules
            stringUrlsImages = tabUrlsFinales.join(',');
        }

        // Insertion dans la base de données Supabase
        const { error: insertError } = await dbClient
            .from('logements')
            .insert([
                {
                    type: type,
                    quartier: quartier,
                    prix: prix,
                    desc_texte: desc,
                    img: stringUrlsImages, // Stockage propre de la liste des liens
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
            alert("Génial ! Votre article avec ses photos a été publié avec succès !");
            document.querySelector('[data-screen="screen-accueil"]').click();
        }, 200);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    chargerLogementsDepuisServeur();
});


// ================= LOGIQUE DU CARROUSEL ET DU PLEIN ÉCRAN =================

let currentImages = []; 
let currentImageIndex = 0;

function initArticleCarousel(images) {
    const container = document.getElementById('modal-carousel-container');
    const dotsContainer = document.getElementById('carousel-dots-container');
    
    // Nettoyage complet
    const oldImages = container.querySelectorAll('.dynamic-carousel-img');
    oldImages.forEach(img => img.remove());
    if (dotsContainer) dotsContainer.innerHTML = '';

    // Découpage propre des URLs
    if (typeof images === 'string') {
        currentImages = images.split(',').map(url => url.trim()).filter(url => url !== '');
    } else if (Array.isArray(images)) {
        currentImages = images;
    } else {
        currentImages = [];
    }

    const prevBtn = document.getElementById('carousel-prev-btn');
    const nextBtn = document.getElementById('carousel-next-btn');
    if (currentImages.length <= 1) {
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';
    } else {
        if(prevBtn) prevBtn.style.display = 'flex';
        if(nextBtn) nextBtn.style.display = 'flex';
    }

    currentImageIndex = 0;

    // Création dynamique des balises images
    currentImages.forEach((url, index) => {
        const img = document.createElement('img');
        img.src = url;
        img.alt = `Photo produit ${index + 1}`;
        img.classList.add('dynamic-carousel-img');
        if (index === 0) img.classList.add('active');
        
        // Clic pour plein écran et zoom instantané
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            openImageFullScreen(url);
        });

        container.appendChild(img);

        // Petits points indicateurs sous le carrousel
        if (currentImages.length > 1 && dotsContainer) {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => showImageAtIndex(index));
            dotsContainer.appendChild(dot);
        }
    });

    const staticImg = document.getElementById('modal-img');
    if (staticImg) staticImg.style.display = 'none';
}

function showImageAtIndex(index) {
    const carouselImages = document.querySelectorAll('.dynamic-carousel-img');
    const dots = document.querySelectorAll('.carousel-dot');
    
    if (carouselImages.length === 0) return;

    if (index >= currentImages.length) currentImageIndex = 0;
    else if (index < 0) currentImageIndex = currentImages.length - 1;
    else currentImageIndex = index;

    carouselImages.forEach((img, i) => {
        if (i === currentImageIndex) img.classList.add('active');
        else img.classList.remove('active');
    });

    dots.forEach((dot, i) => {
        if (i === currentImageIndex) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

// Configuration des écouteurs de clics pour les flèches directionnelles
const nextBtn = document.getElementById('carousel-next-btn');
const prevBtn = document.getElementById('carousel-prev-btn');

if(nextBtn) {
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        showImageAtIndex(currentImageIndex + 1);
    });
}

if(prevBtn) {
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImageAtIndex(currentImageIndex - 1);
    });
}

// ================= SYSTÈME DE VISIONNEUSE PLEIN ÉCRAN (ZOOM CHOC) =================

function openImageFullScreen(url) {
    const fsOverlay = document.createElement('div');
    fsOverlay.style.position = 'fixed';
    fsOverlay.style.top = '0';
    fsOverlay.style.left = '0';
    fsOverlay.style.width = '100vw';
    fsOverlay.style.height = '100vh';
    fsOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    fsOverlay.style.zIndex = '999999';
    fsOverlay.style.display = 'flex';
    fsOverlay.style.alignItems = 'center';
    fsOverlay.style.justifyContent = 'center';
    fsOverlay.style.cursor = 'zoom-out';
    fsOverlay.style.animation = 'fadeIn 0.2s ease-out';

    const fsImg = document.createElement('img');
    fsImg.src = url;
    fsImg.style.maxWidth = '95%';
    fsImg.style.maxHeight = '90%';
    fsImg.style.objectFit = 'contain';
    fsImg.style.borderRadius = '8px';
    fsImg.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '25px';
    closeBtn.style.color = '#fff';
    closeBtn.style.fontSize = '2.5rem';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.cursor = 'pointer';

    fsOverlay.appendChild(fsImg);
    fsOverlay.appendChild(closeBtn);
    document.body.appendChild(fsOverlay);

    fsOverlay.addEventListener('click', () => {
        fsOverlay.remove();
    });
}