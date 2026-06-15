// Endpoint utama TheMealDB API
const API_CARI = "https://www.themealdb.com/api/json/v1/1/search.php?s=";
const API_DETAIL = "https://www.themealdb.com/api/json/v1/1/lookup.php?i=";

const catalogContainer = document.getElementById("catalog-container");
const searchInput = document.getElementById("search-input");

// Ambil Elemen Modal Pop-up dari HTML
const recipeModal = document.getElementById("recipe-modal");
const closeButton = document.querySelector(".close-button");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalBadge = document.getElementById("modal-badge");
const modalOrigin = document.getElementById("modal-origin");
const modalIngredients = document.getElementById("modal-ingredients");
const modalSteps = document.getElementById("modal-steps");

// 1. Fungsi mengambil katalog makanan (Mendukung Paralel Massal A-Z)
async function fetchKatalog(keyword = "") {
    try {
        catalogContainer.innerHTML = '<p class="loading-text">Memuat ratusan resep dari seluruh dunia...</p>';
        
        // JIKA KOLOM PENCARIAN KOSONG (Saat pertama kali web dibuka)
        if (keyword === "") {
            const alfabet = "abcdefghijklmnoprstvwy".split(""); // Semua daftar huruf ber-indeks resep
            let semuaMeals = [];

            // Trik Jitu: Menembak seluruh huruf secara bersamaan (Parallel Fetch)
            const semuaRequest = alfabet.map(huruf => 
                fetch(`${API_CARI}${huruf}`).then(res => res.json())
            );
            
            const hasilRespon = await Promise.all(semuaRequest);
            
            // Satukan seluruh pecahan data menu ke dalam satu wadah besar
            hasilRespon.forEach(data => {
                if (data.meals) {
                    semuaMeals = semuaMeals.concat(data.meals);
                }
            });

            // Acak daftar menunya agar setiap kali web di-refresh, tampilannya bervariasi
            semuaMeals.sort(() => 0.5 - Math.random());

            renderCatalog(semuaMeals);
        } 
        // JIKA USER SEDANG MENGETIK DI KOLOM PENCARIAN
        else {
            const response = await fetch(`${API_CARI}${keyword}`);
            const data = await response.json();
            renderCatalog(data.meals);
        }
    } catch (error) {
        console.error("Gagal memuat katalog massal eksternal:", error);
        catalogContainer.innerHTML = '<p class="error-text">Gagal terhubung ke server API.</p>';
    }
}

// 2. Fungsi memetakan data JSON menjadi deretan Card HTML di halaman utama
function renderCatalog(mealsArray) {
    catalogContainer.innerHTML = "";

    if (mealsArray === null || mealsArray.length === 0) {
        catalogContainer.innerHTML = '<p class="error-text">Resep tidak ditemukan. Coba ketik kata kunci dalam bahasa Inggris (Contoh: chicken, beef, soup, dessert).</p>';
        return;
    }

    mealsArray.forEach(meal => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML = `
            <div class="card-image-wrapper">
                <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
            </div>
            <div class="card-content">
                <h3>${meal.strMeal}</h3>
                <span class="badge">${meal.strCategory}</span>
                <p>Asal Hidangan: <strong>${meal.strArea}</strong></p>
            </div>
        `;

        // EVENT KLIK CARD: Ambil ID makanan untuk dicarikan detail langkah masaknya
        card.addEventListener("click", () => {
            fetchDetailResep(meal.idMeal);
        });

        catalogContainer.appendChild(card);
    });
}

// 3. Fungsi mengambil detail langkah & bahan secara live berdasarkan ID makanan
async function fetchDetailResep(idMeal) {
    try {
        const response = await fetch(`${API_DETAIL}${idMeal}`);
        const data = await response.json();
        bukaModalDetail(data.meals[0]);
    } catch (error) {
        console.error("Gagal memuat detail resep dari API:", error);
    }
}

// 4. Fungsi memproses data detail resep asli API ke dalam komponen Pop-up Modal
function bukaModalDetail(meal) {
    modalImg.src = meal.strMealThumb;
    modalImg.alt = meal.strMeal;
    modalTitle.innerText = meal.strMeal;
    modalBadge.innerText = meal.strCategory;
    modalOrigin.innerHTML = `Asal Negara: <strong>${meal.strArea}</strong>`;

    modalIngredients.innerHTML = "";
    modalSteps.innerHTML = "";

    // Memproses bahan terpisah (strIngredient1 s.d strIngredient20)
    for (let i = 1; i <= 20; i++) {
        const bahan = meal[`strIngredient${i}`];
        const takaran = meal[`strMeasure${i}`];

        if (bahan && bahan.trim() !== "") {
            const li = document.createElement("li");
            li.innerText = `${takaran ? takaran : ""} ${bahan}`;
            modalIngredients.appendChild(li);
        }
    }

    // Memproses langkah memasak (memisahkan teks panjang berdasarkan baris baru)
    const langkahLengkap = meal.strInstructions.split('\n');
    langkahLengkap.forEach(langkah => {
        if (langkah.trim() !== "") {
            const li = document.createElement("li");
            li.innerText = langkah;
            modalSteps.appendChild(li);
        }
    });

    // Tampilkan modal pop-up ke layar
    recipeModal.style.display = "block";
}

// 5. Kontrol Tombol Penutup Modal Pop-up (Tombol X & Klik Area Luar Kotak)
closeButton.addEventListener("click", () => {
    recipeModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === recipeModal) {
        recipeModal.style.display = "none";
    }
});

// 6. Event Listener Kolom Pencarian Real-Time
searchInput.addEventListener("input", (event) => {
    const value = event.target.value.trim();
    fetchKatalog(value);
});

// Jalankan pertama kali secara otomatis (Tanpa kata kunci agar menarik database massal A-Z)
fetchKatalog("");