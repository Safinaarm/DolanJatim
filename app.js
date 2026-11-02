// DolanJatim 2.0 - Joyful, Modern, Interactive Multi-Device Application
// Features: People count calculation (pax), rooms & vehicles scaling,
// Confetti celebrations, Web Audio chimes, mobile-responsive containers, OpenStreetMap OSRM routing

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const originSelect = document.getElementById('originCity');
  const destSelect = document.getElementById('destCity');
  const budgetInput = document.getElementById('budgetInput');
  const budgetRange = document.getElementById('budgetRange');
  const plannerForm = document.getElementById('plannerForm');
  const hotelCheck = document.getElementById('hotelCheck');
  const hotelToggleLabel = document.getElementById('hotelToggleLabel');
  const hotelToggleSub = document.getElementById('hotelToggleSub');
  const loadingBox = document.getElementById('loadingBox');
  const resultsSection = document.getElementById('resultsSection');
  const packagesList = document.getElementById('packagesList');
  const cardsGrid = document.getElementById('cardsGrid');
  const searchInput = document.getElementById('searchInput');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const tabOptionalNotice = document.getElementById('tabOptionalNotice');
  const soundToggleBtn = document.getElementById('soundToggleBtn');

  // People Stepper Elements
  const peopleCountInput = document.getElementById('peopleCount');
  const peopleDisplayNum = document.getElementById('peopleDisplayNum');
  const btnMinusPeople = document.getElementById('btnMinusPeople');
  const btnPlusPeople = document.getElementById('btnPlusPeople');

  // Stats Elements
  const tripSummaryTitle = document.getElementById('tripSummaryTitle');
  const tripSummarySubtitle = document.getElementById('tripSummarySubtitle');
  const statRouteText = document.getElementById('statRouteText');
  const statDistanceText = document.getElementById('statDistanceText');
  const statDurationText = document.getElementById('statDurationText');
  const statTransportCost = document.getElementById('statTransportCost');
  const exploreCityName = document.getElementById('exploreCityName');

  // Tab counters
  const countWisata = document.getElementById('countWisata');
  const countHotel = document.getElementById('countHotel');
  const countResto = document.getElementById('countResto');
  const countCafe = document.getElementById('countCafe');

  // Modal Elements
  const itemPickerModal = document.getElementById('itemPickerModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalSubtitle = document.getElementById('modalSubtitle');
  const modalIconBadge = document.getElementById('modalIconBadge');
  const modalSearchInput = document.getElementById('modalSearchInput');
  const modalItemsList = document.getElementById('modalItemsList');

  // Mobile Floating Bar Elements
  const mobileFloatingBar = document.getElementById('mobileFloatingBar');
  const mobBarPkgTitle = document.getElementById('mobBarPkgTitle');
  const mobBarPrice = document.getElementById('mobBarPrice');
  const mobBarBalance = document.getElementById('mobBarBalance');
  const mobBtnWa = document.getElementById('mobBtnWa');

  // State
  let currentTab = 'wisataTab';
  let mapInstance = null;
  let routeLayer = null;
  let markersLayer = null;
  let currentPackages = [];
  let selectedPackageNum = 1;
  let soundEnabled = true;
  let currentModalTarget = null;

  // 1. Web Audio API Joyful Chimes
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function playChime(type = 'success') {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  soundToggleBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggleBtn.classList.toggle('muted', !soundEnabled);
    soundToggleBtn.innerHTML = soundEnabled 
      ? '<i class="fa-solid fa-volume-high"></i>' 
      : '<i class="fa-solid fa-volume-xmark"></i>';
    showToast(soundEnabled ? '🔊 Efek suara diaktifkan!' : '🔇 Efek suara dimatikan.');
  });

  // 2. Populate Dropdowns
  function populateCities() {
    originSelect.innerHTML = '';
    destSelect.innerHTML = '';

    const cities = [...DOLAN_DATA.cities];
    cities.forEach(city => {
      const opt1 = document.createElement('option');
      opt1.value = city.id;
      opt1.textContent = `${city.name} (${city.tag})`;
      originSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = city.id;
      opt2.textContent = `${city.name} (${city.tag})`;
      destSelect.appendChild(opt2);
    });

    originSelect.value = 'Surabaya';
    destSelect.value = 'Batu';
  }

  // 3. People Count Stepper Logic
  function setPeopleCount(num) {
    const val = Math.max(1, Math.min(20, num));
    peopleCountInput.value = val;
    peopleDisplayNum.textContent = val;

    document.querySelectorAll('.preset-chip-pax').forEach(chip => {
      const p = parseInt(chip.getAttribute('data-pax'), 10);
      chip.classList.toggle('active', p === val);
    });

    playChime('click');
  }

  btnMinusPeople.addEventListener('click', () => {
    const cur = parseInt(peopleCountInput.value, 10) || 2;
    setPeopleCount(cur - 1);
  });

  btnPlusPeople.addEventListener('click', () => {
    const cur = parseInt(peopleCountInput.value, 10) || 2;
    setPeopleCount(cur + 1);
  });

  document.querySelectorAll('.preset-chip-pax').forEach(chip => {
    chip.addEventListener('click', () => {
      const p = parseInt(chip.getAttribute('data-pax'), 10);
      setPeopleCount(p);
    });
  });

  function getPeopleCount() {
    return parseInt(peopleCountInput.value, 10) || 2;
  }

  // 4. Budget Input Masking & Slider Sync
  budgetInput.addEventListener('input', (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      e.target.value = '';
      return;
    }
    let num = parseInt(raw, 10);
    e.target.value = num.toLocaleString('id-ID');
    
    if (num <= 6000000) {
      budgetRange.value = num;
    }
    syncPresetButtons(num);
  });

  budgetRange.addEventListener('input', (e) => {
    let val = parseInt(e.target.value, 10);
    budgetInput.value = val.toLocaleString('id-ID');
    syncPresetButtons(val);
  });

  budgetRange.addEventListener('change', () => {
    playChime('click');
  });

  function parseBudgetValue() {
    let raw = budgetInput.value.replace(/\D/g, '');
    return parseInt(raw, 10) || 0;
  }

  function syncPresetButtons(amount) {
    document.querySelectorAll('.quick-chip').forEach(btn => {
      const b = parseInt(btn.getAttribute('data-budget'), 10);
      btn.classList.toggle('active', b === amount);
    });
  }

  document.querySelectorAll('.quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      playChime('click');
      const b = parseInt(chip.getAttribute('data-budget'), 10);
      budgetInput.value = b.toLocaleString('id-ID');
      budgetRange.value = Math.min(b, 6000000);
      syncPresetButtons(b);
    });
  });

  // 5. Travel Vibe Selector (Gaya Liburan)
  document.querySelectorAll('.vibe-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playChime('click');
      document.querySelectorAll('.vibe-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const vibe = btn.getAttribute('data-vibe');

      if (vibe === 'backpacker') {
        budgetInput.value = (500000).toLocaleString('id-ID');
        budgetRange.value = 500000;
        setPeopleCount(1);
        document.getElementById('transMotor').checked = true;
        hotelCheck.checked = true;
      } else if (vibe === 'roadtrip') {
        budgetInput.value = (2000000).toLocaleString('id-ID');
        budgetRange.value = 2000000;
        setPeopleCount(4);
        document.getElementById('transMobil').checked = true;
        hotelCheck.checked = true;
      } else if (vibe === 'sultan') {
        budgetInput.value = (4000000).toLocaleString('id-ID');
        budgetRange.value = 4000000;
        setPeopleCount(2);
        document.getElementById('transMobil').checked = true;
        hotelCheck.checked = true;
      }
      
      syncHotelLabel();
    });
  });

  function syncHotelLabel() {
    if (hotelCheck.checked) {
      hotelToggleLabel.textContent = 'Ya, Butuh Hotel (1 Malam)';
      hotelToggleSub.textContent = 'Biaya hotel masuk estimasi';
    } else {
      hotelToggleLabel.textContent = 'Tidak Butuh Hotel (Day Trip)';
      hotelToggleSub.textContent = 'Tidak menginap, hemat biaya penginapan';
    }
  }

  hotelCheck.addEventListener('change', () => {
    playChime('click');
    syncHotelLabel();
  });

  document.querySelectorAll('.dest-shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playChime('click');
      document.querySelectorAll('.dest-shortcut-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetCity = btn.getAttribute('data-dest');
      if (targetCity) {
        destSelect.value = targetCity;
        showToast(`📍 Kota tujuan diubah ke ${btn.textContent.trim()}. Klik tombol "Hitung dan Cari Rekomendasi" di atas untuk melihat hasilnya!`);
      }
    });
  });

  // 6. OpenStreetMap OSRM Routing Engine
  async function fetchOsmRoute(originCity, destCity) {
    const origin = DOLAN_DATA.cities.find(c => c.id === originCity);
    const dest = DOLAN_DATA.cities.find(c => c.id === destCity);

    if (!origin || !dest) {
      return { distanceKm: 85, durationMin: 110, geojson: null };
    }

    if (origin.id === dest.id) {
      return {
        distanceKm: 20,
        durationMin: 45,
        geojson: null,
        isSameCity: true
      };
    }

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          return {
            distanceKm: Math.round(r.distance / 1000),
            durationMin: Math.round(r.duration / 60),
            geojson: r.geometry
          };
        }
      }
    } catch (err) {
      console.warn('OSRM routing fetch timed out or offline, using fallback Haversine distance:', err);
    }

    const R = 6371;
    const dLat = (dest.lat - origin.lat) * Math.PI / 180;
    const dLon = (dest.lng - origin.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(origin.lat * Math.PI / 180) * Math.cos(dest.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;
    const roadDist = Math.round(straightDist * 1.28);
    const durationMin = Math.round((roadDist / 55) * 60);

    return {
      distanceKm: roadDist,
      durationMin: durationMin,
      geojson: null
    };
  }

  // 7. Toll Calculation
  function calculateTollCost(originCity, destCity, transport) {
    if (transport !== 'mobil') return 0;
    if (originCity === destCity) return 0;

    if (originCity === 'Surabaya' && DOLAN_DATA.tollRatesFromSurabaya[destCity]) {
      return DOLAN_DATA.tollRatesFromSurabaya[destCity] * 2;
    }
    if (destCity === 'Surabaya' && DOLAN_DATA.tollRatesFromSurabaya[originCity]) {
      return DOLAN_DATA.tollRatesFromSurabaya[originCity] * 2;
    }

    const tollCorridor = ['Surabaya', 'Malang', 'Batu', 'Sidoarjo', 'Gresik', 'Mojokerto', 'Jombang', 'Nganjuk', 'Madiun', 'Ngawi', 'Pasuruan', 'Probolinggo'];
    if (tollCorridor.includes(originCity) && tollCorridor.includes(destCity)) {
      return 65000 * 2;
    }

    return 0;
  }

  // 8. Clean Price Formatter (strictly convert IDR -> Rp)
  function cleanPriceDisplay(str) {
    if (!str) return 'Gratis';
    let s = String(str).trim();
    s = s.replace(/IDR|idr/g, 'Rp');
    s = s.replace(/Rp\s*/g, 'Rp ');
    s = s.replace(/\s+/g, ' ').trim();
    return s;
  }

  // 9. Generate Smart Recommendation Packages Tailored to User's Budget & People Count
  function generatePackages(destCity, userBudget, pax, distanceRoundTrip, transport, needHotel, origName, destName, oneWayTollCost) {
    const rawWisata = DOLAN_DATA.wisata.filter(w => w.city === destCity);
    const rawHotels = DOLAN_DATA.penginapan.filter(h => h.city === destCity);
    const rawRestos = DOLAN_DATA.resto.filter(r => r.city === destCity);
    const rawCafes = DOLAN_DATA.cafe.filter(c => c.city === destCity);

    const sortedHotels = [...rawHotels].sort((a, b) => a.price - b.price);
    const sortedWisata = [...rawWisata].sort((a, b) => (b.price || 0) - (a.price || 0));

    // Vehicle Scaling based on people count
    let vehicleCount = 1;
    let fuelCost = 0;
    let tollCost = 0;
    let transportDetail = '';

    if (transport === 'motor') {
      // 1 motor carries 2 pax max
      vehicleCount = Math.ceil(pax / 2);
      const litersPerMotor = distanceRoundTrip / 40;
      const fuelPerMotor = Math.max(15000, Math.round(litersPerMotor * 10000));
      fuelCost = fuelPerMotor * vehicleCount;
      tollCost = 0;
      transportDetail = `Motor (${vehicleCount} unit untuk ${pax} orang) • ${vehicleCount > 1 ? `${vehicleCount}x bensin` : 'Pertalite'}`;
    } else {
      // 1 standard car carries 6 pax max
      vehicleCount = Math.ceil(pax / 6);
      const litersPerCar = distanceRoundTrip / 11;
      const fuelPerCar = Math.max(40000, Math.round(litersPerCar * 12500));
      fuelCost = fuelPerCar * vehicleCount;
      tollCost = oneWayTollCost * vehicleCount;
      transportDetail = `Mobil (${vehicleCount} mobil untuk ${pax} orang) • BBM & Tol`;
    }

    const transportCost = fuelCost + tollCost;

    // Room Scaling based on people count (2 pax per room)
    const roomsNeeded = needHotel ? Math.ceil(pax / 2) : 0;

    const packages = [];

    const getWisata = (idx, fallbackPrice = 25000) => {
      if (rawWisata.length > idx) return rawWisata[idx];
      if (rawWisata.length > 0) return rawWisata[0];
      return {
        id: 'w_dummy',
        name: `Destinasi Ikonik ${destName}`,
        city: destCity,
        location: destName,
        price: fallbackPrice,
        priceDisplay: `Rp ${fallbackPrice.toLocaleString('id-ID')}`,
        category: 'Wisata'
      };
    };

    const getHotel = (tier) => {
      if (!needHotel) {
        return {
          id: 'h_none',
          name: 'Mode Day Trip (Tanpa Penginapan)',
          city: destCity,
          location: 'Pulang hari / Rumah kerabat',
          price: 0,
          priceDisplay: 'Rp 0',
          rating: '5.0',
          isDayTrip: true
        };
      }

      if (sortedHotels.length === 0) {
        return {
          id: 'h_default',
          name: `Homestay Nyaman ${destName}`,
          city: destCity,
          location: `Pusat Kota ${destName}`,
          price: 150000,
          priceDisplay: 'Rp 150.000',
          rating: '4.5'
        };
      }

      if (tier === 'budget') {
        return sortedHotels[0];
      } else if (tier === 'mid') {
        const midIdx = Math.floor(sortedHotels.length / 2);
        return sortedHotels[midIdx] || sortedHotels[0];
      } else {
        const topIdx = Math.min(sortedHotels.length - 1, Math.max(0, sortedHotels.length - 3));
        return sortedHotels[topIdx] || sortedHotels[0];
      }
    };

    const getResto = (idx) => {
      if (rawRestos.length > idx) return rawRestos[idx];
      if (rawRestos.length > 0) return rawRestos[0];
      return {
        id: 'r_dummy',
        name: `Kuliner Khas & Warung Tradisional ${destName}`,
        location: `Area Wisata ${destName}`,
        priceRange: 'Rp 25.000 - 50.000',
        rating: '4.6'
      };
    };

    const getCafe = (idx) => {
      if (rawCafes.length > idx) return rawCafes[idx];
      if (rawCafes.length > 0) return rawCafes[0];
      return {
        id: 'c_dummy',
        name: `Kedai Kopi & Cafe Santai ${destName}`,
        location: `Pusat Kota ${destName}`,
        priceRange: 'Rp 20.000 - 45.000',
        rating: '4.7'
      };
    };

    // Calculate Package Helper
    const buildPackageObj = (num, title, subtitle, w, h, r, c) => {
      const totalTickets = (w.price || 0) * pax;
      const totalHotel = needHotel ? (h.price * roomsNeeded) : 0;
      const totalMandatory = transportCost + totalTickets + totalHotel;
      const balance = userBudget - totalMandatory;
      const costPerPerson = Math.round(totalMandatory / pax);

      return {
        num,
        title,
        subtitle,
        wisata: w,
        hotel: h,
        resto: r,
        cafe: c,
        pax,
        roomsNeeded,
        vehicleCount,
        fuelCost,
        tollCost,
        transportCost,
        transportDetail,
        totalTickets,
        totalHotel,
        totalMandatory,
        costPerPerson,
        balance,
        isMatch: balance >= 0
      };
    };

    // PACKAGE 1: Paling Populer & Favorit (Contoh: Jatim Park 1/2 di Batu)
    const w1 = getWisata(0, 100000);
    const h1 = getHotel(userBudget > 1200000 ? 'mid' : 'budget');
    packages.push(buildPackageObj(1, `Paket Utama: ${w1.name}`, `Rekomendasi terbaik wisata ikonik dengan penginapan strategis`, w1, h1, getResto(0), getCafe(0)));

    // PACKAGE 2: Alternatif Rekreasi / Alam
    const w2 = getWisata(Math.min(1, rawWisata.length - 1), 50000);
    const h2 = getHotel('budget');
    packages.push(buildPackageObj(2, `Paket Alternatif: ${w2.name}`, `Pilihan rekreasi seru & santai dengan alokasi biaya efisien`, w2, h2, getResto(1), getCafe(1)));

    // PACKAGE 3: Pilihan Ramah Budget / Backpacker
    let cheapWisata = rawWisata.find(w => w.price <= 20000) || getWisata(rawWisata.length - 1, 15000);
    const h3 = getHotel('budget');
    packages.push(buildPackageObj(3, `Paket Hemat: ${cheapWisata.name}`, `Paling ramah di kantong dengan destinasi asri & hostel backpacker`, cheapWisata, h3, getResto(2), getCafe(2)));

    return packages;
  }

  // 9b. State of which packages have their budget details expanded
  let expandedPackages = new Set([1]); // Package 1 expanded by default

  // Toggle package budget estimation view
  window.togglePackageBudget = function(packageNum, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const container = document.getElementById(`pkg-container-${packageNum}`);
    if (!container) return;

    const drawer = container.querySelector('.package-budget-drawer');
    const chevron = container.querySelector('.toggle-chevron-circle');
    const hintText = container.querySelector('.trigger-sub-hint');
    const statusPill = container.querySelector('.trigger-badge-status');
    const btnToggleViewText = container.querySelector('.btn-toggle-view span');

    const isExpanded = expandedPackages.has(packageNum);
    if (isExpanded) {
      expandedPackages.delete(packageNum);
      container.classList.remove('budget-expanded');
      if (drawer) drawer.style.display = 'none';
      if (chevron) chevron.classList.remove('open');
      if (hintText) hintText.textContent = 'Klik container ini untuk melihat rincian kalkulasi bensin, tarif tol, tiket masuk & patungan';
      if (statusPill) {
        statusPill.textContent = 'Klik untuk Membuka';
        statusPill.classList.remove('open');
      }
      if (btnToggleViewText) btnToggleViewText.textContent = 'Lihat Catatan Anggaran';
    } else {
      expandedPackages.add(packageNum);
      container.classList.add('budget-expanded');
      if (drawer) drawer.style.display = 'block';
      if (chevron) chevron.classList.add('open');
      if (hintText) hintText.textContent = 'Klik di sini atau klik container untuk menutup catatan rincian biaya';
      if (statusPill) {
        statusPill.textContent = 'Sedang Ditampilkan';
        statusPill.classList.add('open');
      }
      if (btnToggleViewText) btnToggleViewText.textContent = 'Tutup Catatan';
    }
    playChime('click');
  };

  // 10. Render All Package Containers to DOM
  function renderPackageContainers() {
    if (!currentPackages || currentPackages.length === 0) return;
    const calcMeta = window.currentCalcMeta;
    packagesList.innerHTML = '';

    currentPackages.forEach(pkg => {
      const isSelected = pkg.num === selectedPackageNum;
      const isSurplus = pkg.balance >= 0;
      const isExpanded = expandedPackages.has(pkg.num);
      const balanceLabel = isSurplus ? 'Sisa Budget Anda' : 'Kekurangan Budget';
      const balanceText = isSurplus ? `+${formatRupiah(pkg.balance)}` : `-${formatRupiah(Math.abs(pkg.balance))}`;
      
      let badgeTag = '';
      if (isSurplus) {
        badgeTag = `<div class="package-budget-tag surplus"><i class="fa-solid fa-circle-check"></i> Masuk Budget (Sisa ${formatRupiah(pkg.balance)})</div>`;
      } else {
        badgeTag = `<div class="package-budget-tag deficit"><i class="fa-solid fa-triangle-exclamation"></i> Melebihi Budget (Kurang ${formatRupiah(Math.abs(pkg.balance))})</div>`;
      }

      // Budget Usage Percentage Meter
      const budgetPct = Math.min(100, Math.round((pkg.totalMandatory / calcMeta.userBudget) * 100));
      let meterClass = 'safe';
      if (budgetPct > 85 && budgetPct <= 100) meterClass = 'warn';
      else if (budgetPct > 100) meterClass = 'danger';

      let hotelDisplayPrice = calcMeta.needHotel 
        ? `${formatRupiah(pkg.hotel.price * pkg.roomsNeeded)}` 
        : 'Rp 0 (Day Trip)';
      let hotelSubtitle = calcMeta.needHotel 
        ? `${pkg.roomsNeeded} kamar untuk ${pkg.pax} orang (1 malam)` 
        : 'Tanpa menginap / pulang hari';

      let hotelMapsQuery = encodeURIComponent(`${pkg.hotel.name} ${pkg.hotel.location}`);
      let hotelMapsBtn = !pkg.hotel.isDayTrip 
        ? `<a href="https://www.google.com/maps/search/?api=1&query=${hotelMapsQuery}" target="_blank" rel="noopener" class="rec-btn-action" onclick="event.stopPropagation();" title="Buka di Google Maps"><i class="fa-solid fa-arrow-up-right-from-square"></i> Peta</a>`
        : '';

      let wisataMapsQuery = encodeURIComponent(`${pkg.wisata.name} ${pkg.wisata.location}`);
      let restoMapsQuery = encodeURIComponent(`${pkg.resto.name} ${pkg.resto.location}`);
      let cafeMapsQuery = encodeURIComponent(`${pkg.cafe.name} ${pkg.cafe.location}`);

      const containerEl = document.createElement('div');
      containerEl.className = `package-container ${isSelected ? 'selected' : ''} ${isExpanded ? 'budget-expanded' : ''}`;
      containerEl.id = `pkg-container-${pkg.num}`;
      
      containerEl.innerHTML = `
        <!-- Package Top Header -->
        <div class="package-top-bar">
          <div class="package-title-group">
            <span class="package-badge-num">${pkg.num}</span>
            <div>
              <div class="package-title-row">
                <h4>${pkg.title}</h4>
                ${badgeTag}
              </div>
              <p class="package-subtitle">${pkg.subtitle}</p>
            </div>
          </div>
          <div class="package-header-actions">
            <div class="package-cost-badge">
              <span class="cost-badge-label">Total Estimasi:</span>
              <strong class="cost-badge-val">${formatRupiah(pkg.totalMandatory)}</strong>
              <span class="cost-badge-pax">${formatRupiah(pkg.costPerPerson)} / org</span>
            </div>
            <button type="button" class="btn-select-pkg" onclick="selectPackage(${pkg.num}); event.stopPropagation();">
              <i class="fa-solid ${isSelected ? 'fa-check' : 'fa-star'}"></i>
              <span>${isSelected ? 'Terpilih' : 'Pilih Paket Ini'}</span>
            </button>
          </div>
        </div>

        <!-- Recommended Items Grid -->
        <div class="package-items-section">
          <div class="recs-items-grid">
            
            <!-- 1. WISATA ITEM -->
            <div class="rec-item-card">
              <div class="rec-item-left">
                <div class="rec-icon wisata">
                  <i class="fa-solid fa-mountain-sun"></i>
                </div>
                <div>
                  <span class="rec-meta-type"><span class="badge-included">Wajib</span> Destinasi Wisata Utama</span>
                  <div class="rec-item-name">${pkg.wisata.name}</div>
                  <div class="rec-item-loc"><i class="fa-solid fa-location-dot"></i> ${pkg.wisata.location}</div>
                </div>
              </div>
              <div class="rec-item-right">
                <div>
                  <div class="rec-price-val">${formatRupiah(pkg.totalTickets)}</div>
                  <div class="rec-price-sub">${pkg.pax} orang @ ${cleanPriceDisplay(pkg.wisata.priceDisplay || formatRupiah(pkg.wisata.price))}</div>
                </div>
                <div class="rec-actions-bar">
                  <button type="button" class="rec-btn-action swap-btn" onclick="openPlaceModal(${pkg.num}, 'wisata'); event.stopPropagation();" title="Pilih tempat wisata alternatif">
                    <i class="fa-solid fa-arrows-rotate"></i> Ganti
                  </button>
                  <a href="https://www.google.com/maps/search/?api=1&query=${wisataMapsQuery}" target="_blank" rel="noopener" class="rec-btn-action" onclick="event.stopPropagation();" title="Buka di Google Maps">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Peta
                  </a>
                </div>
              </div>
            </div>

            <!-- 2. HOTEL ITEM -->
            <div class="rec-item-card">
              <div class="rec-item-left">
                <div class="rec-icon hotel">
                  <i class="fa-solid fa-bed"></i>
                </div>
                <div>
                  <span class="rec-meta-type"><span class="badge-included">Wajib</span> Rekomendasi Penginapan</span>
                  <div class="rec-item-name">${pkg.hotel.name}</div>
                  <div class="rec-item-loc"><i class="fa-solid fa-location-dot"></i> ${pkg.hotel.location} • ⭐ ${pkg.hotel.rating || '4.5'}</div>
                </div>
              </div>
              <div class="rec-item-right">
                <div>
                  <div class="rec-price-val">${hotelDisplayPrice}</div>
                  <div class="rec-price-sub">${hotelSubtitle}</div>
                </div>
                <div class="rec-actions-bar">
                  ${calcMeta.needHotel ? `
                  <button type="button" class="rec-btn-action swap-btn" onclick="openPlaceModal(${pkg.num}, 'hotel'); event.stopPropagation();" title="Pilih hotel alternatif">
                    <i class="fa-solid fa-arrows-rotate"></i> Ganti
                  </button>` : ''}
                  ${hotelMapsBtn}
                </div>
              </div>
            </div>

            <!-- 3. RESTO ITEM (OPSIONAL) -->
            <div class="rec-item-card optional">
              <div class="rec-item-left">
                <div class="rec-icon resto">
                  <i class="fa-solid fa-utensils"></i>
                </div>
                <div>
                  <span class="rec-meta-type"><span class="badge-optional">Opsional</span> Kuliner Lokal Rekomendasi</span>
                  <div class="rec-item-name">${pkg.resto.name}</div>
                  <div class="rec-item-loc"><i class="fa-solid fa-location-dot"></i> ${pkg.resto.location}</div>
                </div>
              </div>
              <div class="rec-item-right">
                <div>
                  <div class="rec-price-val" style="color:#b45309;">${cleanPriceDisplay(pkg.resto.priceRange || 'Rp 25.000 - 50.000')}</div>
                  <div class="rec-price-sub">Tidak masuk biaya wajib</div>
                </div>
                <div class="rec-actions-bar">
                  <button type="button" class="rec-btn-action swap-btn" onclick="openPlaceModal(${pkg.num}, 'resto'); event.stopPropagation();" title="Pilih resto alternatif">
                    <i class="fa-solid fa-arrows-rotate"></i> Ganti
                  </button>
                  <a href="https://www.google.com/maps/search/?api=1&query=${restoMapsQuery}" target="_blank" rel="noopener" class="rec-btn-action" onclick="event.stopPropagation();" title="Buka di Google Maps">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Peta
                  </a>
                </div>
              </div>
            </div>

            <!-- 4. CAFE ITEM (OPSIONAL) -->
            <div class="rec-item-card optional">
              <div class="rec-item-left">
                <div class="rec-icon cafe">
                  <i class="fa-solid fa-mug-saucer"></i>
                </div>
                <div>
                  <span class="rec-meta-type"><span class="badge-optional">Opsional</span> Cafe & Tempat Santai</span>
                  <div class="rec-item-name">${pkg.cafe.name}</div>
                  <div class="rec-item-loc"><i class="fa-solid fa-location-dot"></i> ${pkg.cafe.location}</div>
                </div>
              </div>
              <div class="rec-item-right">
                <div>
                  <div class="rec-price-val" style="color:#7e22ce;">${cleanPriceDisplay(pkg.cafe.priceRange || 'Rp 20.000 - 45.000')}</div>
                  <div class="rec-price-sub">Tidak masuk biaya wajib</div>
                </div>
                <div class="rec-actions-bar">
                  <button type="button" class="rec-btn-action swap-btn" onclick="openPlaceModal(${pkg.num}, 'cafe'); event.stopPropagation();" title="Pilih cafe alternatif">
                    <i class="fa-solid fa-arrows-rotate"></i> Ganti
                  </button>
                  <a href="https://www.google.com/maps/search/?api=1&query=${cafeMapsQuery}" target="_blank" rel="noopener" class="rec-btn-action" onclick="event.stopPropagation();" title="Buka di Google Maps">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Peta
                  </a>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Interactive Budget Trigger Bar (Klik container untuk melihat rincian estimasi anggaran) -->
        <div class="package-budget-trigger-bar" onclick="togglePackageBudget(${pkg.num}, event)">
          <div class="trigger-bar-left">
            <div class="trigger-icon-circle">
              <i class="fa-solid fa-file-invoice-dollar"></i>
            </div>
            <div class="trigger-title-wrap">
              <div class="trigger-title-row">
                <strong>Catatan Estimasi Anggaran Paket ${pkg.num}</strong>
                <span class="trigger-badge-status ${isExpanded ? 'open' : ''}">${isExpanded ? 'Sedang Ditampilkan' : 'Klik untuk Membuka'}</span>
              </div>
              <span class="trigger-sub-hint">
                ${isExpanded 
                  ? 'Klik di sini atau klik container untuk menutup catatan estimasi anggaran' 
                  : 'Klik container ini untuk melihat rincian kalkulasi bensin, tarif tol, tiket masuk & patungan'}
              </span>
            </div>
          </div>
          <div class="trigger-bar-right">
            <div class="btn-toggle-view">
              <span>${isExpanded ? 'Tutup Catatan' : 'Lihat Catatan Anggaran'}</span>
              <div class="toggle-chevron-circle ${isExpanded ? 'open' : ''}">
                <i class="fa-solid fa-chevron-down"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Expandable Catatan Estimasi Anggaran (Receipt Drawer) -->
        <div class="package-budget-drawer" style="display: ${isExpanded ? 'block' : 'none'};">
          <div class="package-receipt-modern">
            <div class="receipt-header-mini">
              <span class="receipt-pax-badge">Struk Estimasi Paket ${pkg.num} • ${pkg.pax} Orang</span>
              <h5>Catatan Estimasi Anggaran Lengkap</h5>
              <p>${calcMeta.origName} ➔ ${calcMeta.destName} (${calcMeta.distanceOneWay} km)</p>
            </div>

            <table class="receipt-calc-table">
              <tr>
                <td>
                  <i class="fa-solid fa-gas-pump" style="color:var(--primary);"></i> Bensin Transport (PP)
                  <span class="table-sub">${pkg.transportDetail}</span>
                </td>
                <td>${formatRupiah(pkg.fuelCost)}</td>
              </tr>
              ${calcMeta.transport === 'mobil' && pkg.tollCost > 0 ? `
              <tr>
                <td>
                  <i class="fa-solid fa-road" style="color:var(--secondary);"></i> Tarif Tol (PP)
                  <span class="table-sub">${pkg.vehicleCount} mobil • Tol Trans-Jawa Gol. 1</span>
                </td>
                <td>${formatRupiah(pkg.tollCost)}</td>
              </tr>` : ''}
              <tr>
                <td>
                  <i class="fa-solid fa-ticket" style="color:#d97706;"></i> Tiket Masuk: ${pkg.wisata.name}
                  <span class="table-sub">${pkg.pax} tiket masuk</span>
                </td>
                <td>${formatRupiah(pkg.totalTickets)}</td>
              </tr>
              <tr>
                <td>
                  <i class="fa-solid fa-bed" style="color:#0284c7;"></i> Penginapan (1 Malam)
                  <span class="table-sub">${calcMeta.needHotel ? `${pkg.roomsNeeded} kamar (${pkg.hotel.name})` : 'Mode Day Trip (Rp 0)'}</span>
                </td>
                <td>${formatRupiah(pkg.totalHotel)}</td>
              </tr>
            </table>

            <!-- Budget Usage Thermometer -->
            <div class="budget-meter-container">
              <div class="meter-header">
                <span>Alokasi Budget Rombongan</span>
                <strong>${budgetPct}% Terpakai</strong>
              </div>
              <div class="meter-bar-track">
                <div class="meter-bar-fill ${meterClass}" style="width: ${budgetPct}%;"></div>
              </div>
            </div>

            <div class="receipt-summary-box">
              <div class="receipt-summary-row">
                <span>Budget Rombongan (Input)</span>
                <span>${formatRupiah(calcMeta.userBudget)}</span>
              </div>
              <div class="receipt-summary-row">
                <span>Total Estimasi Wajib</span>
                <span>${formatRupiah(pkg.totalMandatory)}</span>
              </div>
              <div class="receipt-summary-row final" style="color: ${isSurplus ? '#047857' : '#b91c1c'};">
                <span>${balanceLabel}</span>
                <span>${balanceText}</span>
              </div>
            </div>

            <!-- Patungan per Orang Box -->
            <div class="receipt-patungan-box">
              <span><i class="fa-solid fa-user-group"></i> Patungan per Orang (${pkg.pax} org):</span>
              <strong>${formatRupiah(pkg.costPerPerson)} / org</strong>
            </div>

            <div class="optional-reminder">
              <i class="fa-solid fa-circle-info"></i> <strong>Catatan Resto & Cafe:</strong> Bersifat opsional dan tidak dimasukkan ke dalam total wajib di atas agar anggaran liburan Anda tetap fleksibel.
            </div>

            <button type="button" class="btn-copy-package" onclick="copyPackageNote(${pkg.num}); event.stopPropagation();">
              <i class="fa-brands fa-whatsapp"></i> Salin Rincian Paket ${pkg.num} ke WhatsApp
            </button>
          </div>
        </div>
      `;

      // Clicking anywhere on container toggles budget view
      containerEl.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select, .rec-btn-action, .btn-select-pkg, .btn-copy-package')) {
          return;
        }
        togglePackageBudget(pkg.num);
      });

      packagesList.appendChild(containerEl);
    });

    updateMobileBar();
  }

  // 11. Interactive Package Selection with Joyful Feedback
  window.selectPackage = function(packageNum) {
    playChime('success');
    selectedPackageNum = packageNum;
    renderPackageContainers();

    if (window.confetti) {
      window.confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.7 }
      });
    }

    showToast(`⭐ Paket ${packageNum} berhasil dipilih sebagai rencana perjalanan Anda!`);
  };

  // 12. Update Mobile Sticky Floating Bar
  function updateMobileBar() {
    const pkg = currentPackages.find(p => p.num === selectedPackageNum) || currentPackages[0];
    if (!pkg) return;

    mobBarPkgTitle.textContent = `Paket ${pkg.num} (${pkg.pax} Orang)`;
    mobBarPrice.textContent = formatRupiah(pkg.totalMandatory);
    mobBarBalance.textContent = pkg.balance >= 0 
      ? `Sisa: +${formatRupiah(pkg.balance)}` 
      : `Kurang: -${formatRupiah(Math.abs(pkg.balance))}`;
    mobBarBalance.style.color = pkg.balance >= 0 ? '#047857' : '#b91c1c';

    mobileFloatingBar.classList.add('active');
  }

  mobBtnWa.addEventListener('click', () => {
    copyPackageNote(selectedPackageNum);
  });

  // 13. Interactive Modal Place Picker ("Ganti Tempat")
  window.openPlaceModal = function(pkgNum, itemType) {
    playChime('click');
    const calcMeta = window.currentCalcMeta;
    if (!calcMeta) return;

    currentModalTarget = { pkgNum, itemType };
    modalSearchInput.value = '';

    const destCity = calcMeta.dest;
    let listData = [];
    let titleText = '';
    let iconBadge = '';

    if (itemType === 'wisata') {
      titleText = `Pilih Wisata di ${calcMeta.destName}`;
      iconBadge = '🎡';
      listData = DOLAN_DATA.wisata.filter(w => w.city === destCity);
    } else if (itemType === 'hotel') {
      titleText = `Pilih Penginapan di ${calcMeta.destName}`;
      iconBadge = '🏨';
      listData = DOLAN_DATA.penginapan.filter(h => h.city === destCity);
    } else if (itemType === 'resto') {
      titleText = `Pilih Resto di ${calcMeta.destName}`;
      iconBadge = '🍲';
      listData = DOLAN_DATA.resto.filter(r => r.city === destCity);
    } else if (itemType === 'cafe') {
      titleText = `Pilih Cafe di ${calcMeta.destName}`;
      iconBadge = '☕';
      listData = DOLAN_DATA.cafe.filter(c => c.city === destCity);
    }

    modalTitle.textContent = titleText;
    modalSubtitle.textContent = `Tersedia ${listData.length} pilihan. Klik salah satu untuk mengganti.`;
    modalIconBadge.textContent = iconBadge;

    renderModalItems(listData, itemType);
    itemPickerModal.classList.add('show');
  };

  function renderModalItems(items, itemType) {
    modalItemsList.innerHTML = '';
    const kw = modalSearchInput.value.toLowerCase().trim();

    const filtered = items.filter(it => {
      if (!kw) return true;
      return (it.name && it.name.toLowerCase().includes(kw)) ||
             (it.location && it.location.toLowerCase().includes(kw));
    });

    if (filtered.length === 0) {
      modalItemsList.innerHTML = `<div style="text-align:center; padding:2rem; color:#64748b;">Tidak ada tempat ditemukan dengan kata kunci "${kw}".</div>`;
      return;
    }

    filtered.forEach(it => {
      const row = document.createElement('div');
      row.className = 'modal-place-row';

      let priceStr = '';
      if (itemType === 'wisata') priceStr = cleanPriceDisplay(it.priceDisplay || formatRupiah(it.price));
      else if (itemType === 'hotel') priceStr = cleanPriceDisplay(it.priceDisplay || formatRupiah(it.price));
      else priceStr = cleanPriceDisplay(it.priceRange || 'Rp 25.000 - 50.000');

      row.innerHTML = `
        <div class="modal-place-info">
          <strong>${it.name}</strong>
          <span><i class="fa-solid fa-location-dot"></i> ${it.location || ''} ${it.rating ? '• ⭐ ' + it.rating : ''}</span>
        </div>
        <div class="modal-place-price">${priceStr}</div>
      `;

      row.addEventListener('click', () => {
        applyItemSelection(it);
      });

      modalItemsList.appendChild(row);
    });
  }

  modalSearchInput.addEventListener('input', () => {
    if (!currentModalTarget) return;
    const destCity = window.currentCalcMeta.dest;
    let listData = [];
    if (currentModalTarget.itemType === 'wisata') listData = DOLAN_DATA.wisata.filter(w => w.city === destCity);
    else if (currentModalTarget.itemType === 'hotel') listData = DOLAN_DATA.penginapan.filter(h => h.city === destCity);
    else if (currentModalTarget.itemType === 'resto') listData = DOLAN_DATA.resto.filter(r => r.city === destCity);
    else if (currentModalTarget.itemType === 'cafe') listData = DOLAN_DATA.cafe.filter(c => c.city === destCity);
    renderModalItems(listData, currentModalTarget.itemType);
  });

  function applyItemSelection(selectedItem) {
    if (!currentModalTarget) return;
    const { pkgNum, itemType } = currentModalTarget;
    const pkg = currentPackages.find(p => p.num === pkgNum);
    const calcMeta = window.currentCalcMeta;

    if (itemType === 'wisata') {
      pkg.wisata = selectedItem;
      pkg.title = `Paket ${pkg.num}: ${selectedItem.name}`;
      pkg.totalTickets = (selectedItem.price || 0) * pkg.pax;
    } else if (itemType === 'hotel') {
      pkg.hotel = selectedItem;
      pkg.totalHotel = calcMeta.needHotel ? (selectedItem.price * pkg.roomsNeeded) : 0;
    } else if (itemType === 'resto') {
      pkg.resto = selectedItem;
    } else if (itemType === 'cafe') {
      pkg.cafe = selectedItem;
    }

    // Recalculate package
    pkg.totalMandatory = pkg.transportCost + pkg.totalTickets + pkg.totalHotel;
    pkg.costPerPerson = Math.round(pkg.totalMandatory / pkg.pax);
    pkg.balance = calcMeta.userBudget - pkg.totalMandatory;
    pkg.isMatch = pkg.balance >= 0;

    itemPickerModal.classList.remove('show');
    expandedPackages.add(pkg.num);
    renderPackageContainers();
    playChime('success');
    showToast(`✅ ${selectedItem.name} berhasil diterapkan pada Paket ${pkg.num}!`);
  }

  btnCloseModal.addEventListener('click', () => {
    itemPickerModal.classList.remove('show');
  });

  itemPickerModal.addEventListener('click', (e) => {
    if (e.target === itemPickerModal) {
      itemPickerModal.classList.remove('show');
    }
  });

  // 14. Core Calculation Flow
  async function calculateAndRecommend() {
    const origin = originSelect.value;
    const dest = destSelect.value;
    const userBudget = parseBudgetValue();
    const transport = document.querySelector('input[name="transport"]:checked').value;
    const needHotel = hotelCheck.checked;
    const pax = getPeopleCount();

    if (!userBudget || userBudget <= 0) {
      showToast('Harap masukkan nominal budget liburan Anda!');
      budgetInput.focus();
      return;
    }

    loadingBox.style.display = 'flex';
    resultsSection.style.display = 'none';
    mobileFloatingBar.classList.remove('active');
    loadingBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const routeData = await fetchOsmRoute(origin, dest);
    loadingBox.style.display = 'none';
    resultsSection.style.display = 'block';

    const distanceOneWay = routeData.distanceKm;
    const distanceRoundTrip = distanceOneWay * 2;
    const durationMin = routeData.durationMin;

    const durHours = Math.floor(durationMin / 60);
    const durMins = durationMin % 60;
    const durationStr = durHours > 0 ? `~${durHours} jam ${durMins} menit` : `~${durMins} menit`;

    const oneWayTollCost = calculateTollCost(origin, dest, transport);

    const origObj = DOLAN_DATA.cities.find(c => c.id === origin) || { name: origin };
    const destObj = DOLAN_DATA.cities.find(c => c.id === dest) || { name: dest };

    tripSummaryTitle.textContent = `Pilihan Paket Liburan ke ${destObj.name} (${pax} Orang)`;
    tripSummarySubtitle.textContent = `Dari ${origObj.name} • Disesuaikan budget rombongan ${formatRupiah(userBudget)}, kendaraan ${transport.toUpperCase()}, dan OpenStreetMap.`;
    statRouteText.textContent = `${origObj.name} ➔ ${destObj.name}`;
    statDistanceText.textContent = `${distanceOneWay} km (PP ${distanceRoundTrip} km)`;
    statDurationText.textContent = durationStr;
    exploreCityName.textContent = destObj.name;

    const calcMeta = {
      origin,
      dest,
      origName: origObj.name,
      destName: destObj.name,
      distanceOneWay,
      distanceRoundTrip,
      durationStr,
      transport,
      needHotel,
      pax,
      userBudget
    };

    currentPackages = generatePackages(
      dest,
      userBudget,
      pax,
      distanceRoundTrip,
      transport,
      needHotel,
      origObj.name,
      destObj.name,
      oneWayTollCost
    );

    // Update Top Overview Transport Display
    if (currentPackages[0]) {
      statTransportCost.textContent = `${formatRupiah(currentPackages[0].transportCost)} (${currentPackages[0].vehicleCount} ${transport === 'motor' ? 'motor' : 'mobil'})`;
    }

    window.currentCalcMeta = calcMeta;
    window.currentPackages = currentPackages;

    renderPackageContainers();
    renderMap(origin, dest, routeData.geojson);
    renderTabsCounts(dest);
    renderCards(dest, currentTab);

    // Confetti celebration if top package matches budget
    if (currentPackages[0] && currentPackages[0].balance >= 0 && window.confetti) {
      setTimeout(() => {
        window.confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
        playChime('success');
      }, 300);
    }

    resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  // 15. Copy Specific Package Note to WhatsApp / Clipboard
  window.copyPackageNote = function(packageNum) {
    if (!window.currentPackages || !window.currentCalcMeta) return;

    const pkg = window.currentPackages.find(p => p.num === packageNum);
    const meta = window.currentCalcMeta;
    if (!pkg) return;

    let text = `*🌴 DOLANJATIM - ${pkg.title.toUpperCase()}*\n`;
    text += `📍 *Rute:* ${meta.origName} ➔ ${meta.destName}\n`;
    text += `👥 *Peserta:* ${pkg.pax} Orang\n`;
    text += `🛣️ *Jarak Tempuh:* ${meta.distanceOneWay} km (PP: ${meta.distanceRoundTrip} km)\n`;
    text += `⏱️ *Waktu Tempuh:* ${meta.durationStr}\n`;
    text += `🛵 *Transportasi:* ${meta.transport.toUpperCase()} (${pkg.vehicleCount} unit)\n`;
    text += `------------------------------------\n`;
    text += `🎡 *Wisata:* ${pkg.wisata.name} (${pkg.pax} tiket = ${formatRupiah(pkg.totalTickets)})\n`;
    text += `🏨 *Penginapan:* ${meta.needHotel ? `${pkg.roomsNeeded} kamar di ${pkg.hotel.name} (${formatRupiah(pkg.totalHotel)})` : 'Mode Day Trip (Rp 0)'}\n`;
    text += `🍽️ *Resto (Opsional):* ${pkg.resto.name} (${cleanPriceDisplay(pkg.resto.priceRange)})\n`;
    text += `☕ *Cafe (Opsional):* ${pkg.cafe.name} (${cleanPriceDisplay(pkg.cafe.priceRange)})\n`;
    text += `------------------------------------\n`;
    text += `⛽ *Bensin PP:* ${formatRupiah(pkg.fuelCost)}\n`;
    if (meta.transport === 'mobil' && pkg.tollCost > 0) {
      text += `💳 *Tarif Tol PP:* ${formatRupiah(pkg.tollCost)}\n`;
    }
    text += `🎟️ *Total Tiket:* ${formatRupiah(pkg.totalTickets)}\n`;
    text += `🏨 *Total Hotel:* ${formatRupiah(pkg.totalHotel)}\n`;
    text += `------------------------------------\n`;
    text += `🧮 *TOTAL BIAYA ROMBONGAN:* ${formatRupiah(pkg.totalMandatory)}\n`;
    text += `💰 *BUDGET ANDA:* ${formatRupiah(meta.userBudget)}\n`;
    if (pkg.balance >= 0) {
      text += `✅ *SISA SALDO:* +${formatRupiah(pkg.balance)} (Aman!)\n`;
    } else {
      text += `⚠️ *KEKURANGAN:* -${formatRupiah(Math.abs(pkg.balance))}\n`;
    }
    text += `\n💵 *PATUNGAN PER ORANG:* ${formatRupiah(pkg.costPerPerson)} / orang\n`;
    text += `\n💡 *Catatan:* Resto & Cafe bersifat opsional sehingga tidak membebani anggaran wajib. Direncanakan lewat DolanJatim 🌟`;

    navigator.clipboard.writeText(text).then(() => {
      showToast(`✅ Catatan Paket ${packageNum} berhasil disalin!`);
    }).catch(() => {
      showToast('Gagal menyalin, periksa izin peramban.');
    });
  };

  // 16. Render Map with Leaflet
  function renderMap(origCity, destCity, routeGeojson) {
    const orig = DOLAN_DATA.cities.find(c => c.id === origCity);
    const dest = DOLAN_DATA.cities.find(c => c.id === destCity);

    if (!mapInstance) {
      mapInstance = L.map('map', { scrollWheelZoom: false }).setView([-7.7, 112.7], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);
      markersLayer = L.layerGroup().addTo(mapInstance);
      routeLayer = L.layerGroup().addTo(mapInstance);
    }

    markersLayer.clearLayers();
    routeLayer.clearLayers();

    const createMarkerIcon = (color, label) => {
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-size: 13px; font-weight: 800;">${label}</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
    };

    L.marker([orig.lat, orig.lng], { icon: createMarkerIcon('#0d9488', 'A') })
      .bindPopup(`<b>Titik Asal:</b> ${orig.name}`)
      .addTo(markersLayer);

    L.marker([dest.lat, dest.lng], { icon: createMarkerIcon('#f43f5e', 'B') })
      .bindPopup(`<b>Tujuan Wisata:</b> ${dest.name}`)
      .addTo(markersLayer);

    if (routeGeojson && routeGeojson.coordinates) {
      const latlngs = routeGeojson.coordinates.map(c => [c[1], c[0]]);
      const polyline = L.polyline(latlngs, {
        color: '#0284c7',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(routeLayer);

      mapInstance.fitBounds(polyline.getBounds(), { padding: [35, 35] });
    } else {
      const polyline = L.polyline([[orig.lat, orig.lng], [dest.lat, dest.lng]], {
        color: '#0284c7',
        weight: 4,
        dashArray: '8, 8'
      }).addTo(routeLayer);
      mapInstance.fitBounds([[orig.lat, orig.lng], [dest.lat, dest.lng]], { padding: [45, 45] });
    }

    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 250);
  }

  // 17. Update Tab Counters
  function renderTabsCounts(destCity) {
    const wCount = DOLAN_DATA.wisata.filter(w => w.city === destCity).length;
    const hCount = DOLAN_DATA.penginapan.filter(h => h.city === destCity).length;
    const rCount = DOLAN_DATA.resto.filter(r => r.city === destCity).length;
    const cCount = DOLAN_DATA.cafe.filter(c => c.city === destCity).length;

    countWisata.textContent = wCount;
    countHotel.textContent = hCount;
    countResto.textContent = rCount;
    countCafe.textContent = cCount;
  }

  // 18. Render Card List for Secondary Explore Section
  function renderCards(destCity, tabType, filterKeyword = '') {
    cardsGrid.innerHTML = '';
    const kw = filterKeyword.toLowerCase().trim();

    let items = [];
    let isOptionalTab = false;

    if (tabType === 'wisataTab') {
      items = DOLAN_DATA.wisata.filter(w => w.city === destCity);
    } else if (tabType === 'hotelTab') {
      items = DOLAN_DATA.penginapan.filter(h => h.city === destCity);
    } else if (tabType === 'restoTab') {
      items = DOLAN_DATA.resto.filter(r => r.city === destCity);
      isOptionalTab = true;
    } else if (tabType === 'cafeTab') {
      items = DOLAN_DATA.cafe.filter(c => c.city === destCity);
      isOptionalTab = true;
    }

    tabOptionalNotice.style.display = isOptionalTab ? 'inline-flex' : 'none';

    if (kw) {
      items = items.filter(item => {
        return (item.name && item.name.toLowerCase().includes(kw)) ||
               (item.location && item.location.toLowerCase().includes(kw));
      });
    }

    if (items.length === 0) {
      cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #64748b;">
          <i class="fa-solid fa-map-location" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem; display: block;"></i>
          <h4 style="font-weight: 800; color: #0f172a;">Tidak ada tempat ditemukan</h4>
          <p>Coba gunakan kata kunci pencarian yang lain.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'item-card';

      const mapQuery = encodeURIComponent(`${item.name} ${item.location}`);
      const gmapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

      let topBadge = '';
      let priceLabel = 'Biaya / Tiket';
      let priceDisplay = cleanPriceDisplay(item.priceDisplay || 'Gratis');

      if (tabType === 'wisataTab') {
        topBadge = `<span class="card-category"><i class="fa-solid fa-tree"></i> ${item.category || 'Wisata'}</span>`;
        priceLabel = 'Harga Tiket';
      } else if (tabType === 'hotelTab') {
        topBadge = `<span class="card-category" style="background:#e0f2fe; color:#0369a1;"><i class="fa-solid fa-bed"></i> Hotel/Hostel</span>`;
        priceLabel = 'Tarif / Malam';
      } else if (tabType === 'restoTab') {
        topBadge = `<span class="card-category" style="background:#fef3c7; color:#92400e;"><i class="fa-solid fa-utensils"></i> Kuliner Lokal (Opsional)</span>`;
        priceLabel = 'Kisaran Harga';
        priceDisplay = cleanPriceDisplay(item.priceRange || 'Rp 25.000 - 50.000');
      } else if (tabType === 'cafeTab') {
        topBadge = `<span class="card-category" style="background:#f3e8ff; color:#6b21a8;"><i class="fa-solid fa-mug-saucer"></i> Cafe & Nongkrong (Opsional)</span>`;
        priceLabel = 'Kisaran Harga';
        priceDisplay = cleanPriceDisplay(item.priceRange || 'Rp 20.000 - 45.000');
      }

      card.innerHTML = `
        <div>
          <div class="card-top">
            ${topBadge}
            <div class="card-rating">
              <i class="fa-solid fa-star"></i>
              <span>${item.rating || '4.5'}</span>
            </div>
          </div>
          <h4 class="card-title">${item.name}</h4>
          <div class="card-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${item.location || destCity}</span>
          </div>
        </div>

        <div class="card-footer">
          <div>
            <span class="card-price-label">${priceLabel}</span>
            <span class="card-price-val">${priceDisplay}</span>
          </div>
          <a href="${gmapsUrl}" target="_blank" rel="noopener noreferrer" class="card-btn-map" title="Buka di Google Maps">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Peta
          </a>
        </div>
      `;

      cardsGrid.appendChild(card);
    });
  }

  // 19. Tab Switch Handlers
  document.querySelectorAll('.m-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playChime('click');
      document.querySelectorAll('.m-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      searchInput.value = '';
      renderCards(destSelect.value, currentTab);
    });
  });

  // 20. Search in Tab
  searchInput.addEventListener('input', (e) => {
    renderCards(destSelect.value, currentTab, e.target.value);
  });

  // 21. Toast Utility
  function showToast(msg) {
    toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 22. Rupiah Formatter Helper
  function formatRupiah(num) {
    if (num === 0) return 'Rp 0';
    return `Rp ${Math.round(num).toLocaleString('id-ID')}`;
  }

  // Form Submission (Triggered only when user clicks button)
  plannerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    calculateAndRecommend();
  });

  // Initial Load - populate dropdowns, wait for user to click button
  populateCities();
});
