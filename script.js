document.addEventListener("DOMContentLoaded", () => {
    
    // --- CONFIGURATION SUPABASE SÉCURISÉE ---
    const supabaseUrl = 'https://pbtbgmnmqjvpicomnzgn.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBidGJnbW5tcWp2cGljb21uemduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NzgwNTAsImV4cCI6MjA5NjE1NDA1MH0.lTB0XvRRiqNPlwug17hnYqBiLIxj5fXWGfJrV9cJyxY';
    
    let supabase = null;
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("⚠️ Le script global Supabase n'est pas chargé.");
    }

    // --- ARTICLES DE SECOURS (Affichés en cas de table vide ou erreur) ---
    const articlesSecours = [
        {
            id: 1,
            nom: "Chaussure Sneaker Luxe",
            prix: 45000,
            boutique: "Enki Style Boutique",
            telephone: "242060000000",
            images: ["https://picsum.photos/400/300?random=1", "https://picsum.photos/400/300?random=2"]
        },
        {
            id: 2,
            nom: "iPhone 13 Pro Max 256Go",
            prix: 450000,
            boutique: "Hiram Tech",
            telephone: "242050000000",
            images: ["https://picsum.photos/400/300?random=3"]
        }
    ];

    // --- FONCTION POUR GÉNÉRER LA CARTE D'UN ARTICLE ---
    function createArticleCard(article) {
        const name = article.nom || article.Nom || "Article sans nom";
        const price = article.prix || article.Prix || 0;
        const shopName = article.boutique || article.Boutique || "Boutique inconnue";
        const phoneNumber = article.telephone || article.Téléphone || "";
        let imagesData = article.images || article.Images || [];

        // Tolérance si images est une chaîne de texte simple au lieu d'un tableau
        if (typeof imagesData === 'string') {
            imagesData = [imagesData];
        }

        const imagesHtml = imagesData.length > 0 
            ? imagesData.map(src => `<img src="${src}" alt="Produit">`).join('')
            : `<img src="https://via.placeholder.com/400x300?text=Pas+d'image" alt="Aucune image">`;
        
        let sliderHtml = "";
        if (imagesData.length > 1) {
            sliderHtml = `
                <div class="slider-container">
                    <button type="button" class="slider-btn left" onclick="slideImages(this, 'left')">&#10094;</button>
                    <div class="card-images">${imagesHtml}</div>
                    <button type="button" class="slider-btn right" onclick="slideImages(this, 'right')">&#10095;</button>
                </div>
            `;
        } else {
            sliderHtml = `
                <div class="slider-container">
                    <div class="card-images">${imagesHtml}</div>
                </div>
            `;
        }
        
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        const waMessage = encodeURIComponent(`Bonjour, je suis intéressé par votre article : ${name}`);

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            ${sliderHtml}
            <div class="card-content">
                <h3>${name}</h3>
                <p><strong>${price.toLocaleString()} FCFA</strong></p>
                <div class="shop-info">🛒 ${shopName}</div>
                <div class="phone-info">📞 ${phoneNumber}</div>
                <a href="https://wa.me/${cleanPhone}?text=${waMessage}" target="_blank" class="btn-whatsapp">
                    💬 Écrire sur WhatsApp
                </a>
            </div>
        `;
        return card;
    }

    // --- CHARGEMENT AUTOMATIQUE AVEC SYSTEME DE SECOURS ---
    async function loadArticles() {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        grid.innerHTML = ''; // Nettoie la grille

        // Si Supabase a échoué au chargement initial
        if (!supabase) {
            console.warn("Supabase indisponible, bascule sur les articles de secours.");
            articlesSecours.forEach(article => grid.appendChild(createArticleCard(article)));
            return;
        }

        try {
            const { data, error } = await supabase
                .from('articles')
                .select('*')
                .order('id', { ascending: false });

            if (error) throw error;

            console.log("📦 Données reçues de Supabase :", data);
            
            if (data && data.length > 0) {
                data.forEach(article => {
                    grid.appendChild(createArticleCard(article));
                });
            } else {
                console.log("La table 'articles' est vide sur Supabase. Chargement du secours.");
                articlesSecours.forEach(article => grid.appendChild(createArticleCard(article)));
            }
        } catch (err) {
            console.error("❌ Erreur Supabase, bascule sur les exemples :", err.message || err);
            // Affichage du secours pour éviter l'écran blanc en cas de coupure ou problème de RLS
            articlesSecours.forEach(article => grid.appendChild(createArticleCard(article)));
        }
    }

    // Lance le chargement global dès l'ouverture du site
    loadArticles();

    // --- ANIMATION D'INTRODUCTION ---
    if (typeof gsap !== 'undefined') {
        gsap.to(".intro-title", { duration: 1, opacity: 1, y: 0, delay: 0.5, ease: "power3.out" });
        gsap.to(".intro-subtitle", { duration: 1, opacity: 1, y: 0, delay: 0.8, ease: "power3.out" });
        gsap.to(".intro-btn", { duration: 1, opacity: 1, y: 0, delay: 1.1, ease: "power3.out" });

        const enterBtn = document.getElementById("enterSiteBtn");
        const introScreen = document.getElementById("introScreen");

        if(enterBtn && introScreen) {
            enterBtn.addEventListener("click", () => {
                gsap.to(introScreen, { 
                    duration: 1, 
                    opacity: 0, 
                    y: "-100%", 
                    ease: "power3.inOut", 
                    onComplete: () => {
                        introScreen.style.display = "none";
                        document.body.classList.remove("intro-active");
                    } 
                });
            });
        }
    } else {
        const introScreen = document.getElementById("introScreen");
        if(introScreen) introScreen.style.display = "none";
        document.body.classList.remove("intro-active");
    }

    // --- GESTION DE LA FENÊTRE MODALE ---
    const modal = document.getElementById("publishModal");
    const openBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");

    if (openBtn) openBtn.addEventListener("click", () => modal.style.display = "flex");
    if (closeModalBtn) closeModalBtn.addEventListener("click", () => modal.style.display = "none");
    
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // --- GESTION DU FORMULAIRE DE PUBLICATION ---
    const sellForm = document.getElementById('sellForm');

    if (sellForm) {
        sellForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = sellForm.querySelector('button[type="submit"]');
            if(submitBtn) {
                submitBtn.innerText = "Publication en cours...";
                submitBtn.disabled = true;
            }

            if (!supabase) {
                alert("Supabase est inaccessible actuellement. Impossible de publier en ligne.");
                if(submitBtn) { submitBtn.innerText = "Publier l'article"; submitBtn.disabled = false; }
                return;
            }

            const name = document.getElementById('prodName').value;
            const rawPrice = document.getElementById('prodPrice').value.replace(/\s/g, '');
            const price = parseFloat(rawPrice) || 0;
            const shopName = document.getElementById('shopName').value;
            const phoneNumber = document.getElementById('phoneNumber').value;
            const fileInput = document.getElementById('imageInput');
            const files = Array.from(fileInput.files);
            
            if (files.length === 0) {
                alert("Veuillez choisir au moins une image.");
                if(submitBtn) { submitBtn.innerText = "Publier l'article"; submitBtn.disabled = false; }
                return; 
            }

            // --- ENVOI DES DONNÉES VERS SUPABASE ---
            let imagesData = []; 
            try {
                for (let file of files) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `produits/${fileName}`;

                    const { error: uploadError } = await supabase.storage.from('images_articles').upload(filePath, file);
                    if (uploadError) throw uploadError;

                    const { data } = supabase.storage.from('images_articles').getPublicUrl(filePath);
                    imagesData.push(data.publicUrl);
                }

                const { error: dbError } = await supabase.from('articles').insert([{ 
                    nom: name, 
                    prix: price, 
                    boutique: shopName, 
                    telephone: phoneNumber, 
                    images: imagesData 
                }]);
                
                if (dbError) throw dbError;

            } catch (error) {
                console.error("❌ ERREUR SUPABASE DÉTAILLÉE :", error);
                alert(`Erreur lors de la publication : ${error.message || "Vérifiez vos configurations."}`);
                if(submitBtn) { submitBtn.innerText = "Publier l'article"; submitBtn.disabled = false; }
                return;
            }

            // Ajout visuel local immédiat sur l'interface
            const grid = document.getElementById('productGrid');
            const card = createArticleCard({ nom: name, prix: price, boutique: shopName, telephone: phoneNumber, images: imagesData });
            
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)'; 
            if (grid) grid.prepend(card); 
            
            if (typeof gsap !== 'undefined') {
                gsap.to(card, { duration: 0.8, opacity: 1, y: 0, ease: "power2.out" });
            } else {
                card.style.transition = 'all 0.8s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }

            showSuccessPopup();
            modal.style.display = "none";
            sellForm.reset();
            if(submitBtn) { submitBtn.innerText = "Publier l'article"; submitBtn.disabled = false; }
        });
    }

    // --- POP-UP ANIMÉ DE REUSSITE ---
    function showSuccessPopup() {
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div class="popup-box" style="background: #1e1e24; color: white; padding: 40px; border-radius: 20px; text-align: center; box-shadow: 0 15px 40px rgba(0,0,0,0.5); border: 2px solid #a855f7; max-width: 450px; width: 85%;">
                <div style="font-size: 60px; margin-bottom: 15px; filter: drop-shadow(0 0 10px #a855f7);">🎉</div>
                <h2 style="margin: 0 0 15px 0; font-family: 'Poppins', sans-serif; font-size: 26px; color: #a855f7;">Félicitations !</h2>
                <p style="margin: 0; font-family: sans-serif; font-size: 16px; line-height: 1.5; color: #e2e8f0;">
                    Vous venez de publier votre article sur <strong style="color: #fff; text-shadow: 0 0 8px #a855f7;">Vente Rapide</strong>.
                </p>
            </div>
        `;

        stylePopup(popup);
        document.body.appendChild(popup);
        const box = popup.querySelector('.popup-box');

        if (typeof gsap !== 'undefined') {
            gsap.set(box, { scale: 0.5, y: 50 });
            gsap.to(popup, { duration: 0.4, opacity: 1, ease: "power2.out" });
            gsap.to(box, { duration: 0.6, scale: 1, y: 0, ease: "back.out(1.7)" });
            gsap.to(box, { duration: 0.4, scale: 0.5, y: -30, delay: 3, ease: "power2.in" });
            gsap.to(popup, { duration: 0.4, opacity: 0, delay: 3, ease: "power2.in", onComplete: () => popup.remove() });
        } else {
            popup.style.transition = 'opacity 0.4s ease';
            setTimeout(() => popup.style.opacity = '1', 10);
            setTimeout(() => {
                popup.style.opacity = '0';
                setTimeout(() => popup.remove(), 400);
            }, 3000);
        }
    }

    function stylePopup(popup) {
        Object.assign(popup.style, {
            position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '999999', opacity: '0'
        });
    }
});

// --- FONCTION DE SLIDE GLOBALE (Accessible depuis le HTML) ---
window.slideImages = function(button, direction) {
    const container = button.parentElement.querySelector('.card-images');
    const scrollAmount = container.clientWidth;
    if(direction === 'right') {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
};