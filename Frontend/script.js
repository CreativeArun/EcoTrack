document.addEventListener('DOMContentLoaded', function () {
            const tabs = document.querySelectorAll('#tabs button');
            const tabContents = document.querySelectorAll('#tab-content .tab-content');
            let map;
            let mapInitialized = false;
            let workerMap;
            let workerMapInitialized = false;

            const loginModal = document.getElementById('login-modal');
            const loginButton = document.getElementById('login-button');
            const closeModalButton = document.getElementById('close-modal-button');

            const hideLogin = () => {
                loginModal.classList.add('hidden');
            }

            loginButton.addEventListener('click', hideLogin);
            closeModalButton.addEventListener('click', hideLogin);

            const initMap = () => {
                if (mapInitialized) return;
                mapInitialized = true;

                map = L.map('map').setView([28.4744, 77.5038], 12);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap contributors'
                }).addTo(map);

                const truckIcon = L.divIcon({ className: 'text-2xl', html: '🚚' });
                const deviationIcon = L.divIcon({ className: 'text-2xl', html: '⚠️' });
                const reportIcon = L.divIcon({ className: 'text-2xl', html: '🚩' });
                
                const trucksData = [
                    { id: 'UP78-A1234', lat: 28.484, lng: 77.513, status: 'On Route' },
                    { id: 'UP78-B5678', lat: 28.465, lng: 77.498, status: 'Idle' },
                ];
                const deviationsData = [
                    { id: 'DEV-001', lat: 28.491, lng: 77.525, truck: 'UP78-A1234' },
                ];
                const reportsData = [
                    { id: 'REP-001', lat: 28.470, lng: 77.530, type: 'Illegal Dumping' },
                ];

                const trucksLayer = L.layerGroup();
                trucksData.forEach(t => {
                    L.marker([t.lat, t.lng], { icon: truckIcon }).addTo(trucksLayer)
                     .bindPopup(`<b>Truck:</b> ${t.id}<br><b>Status:</b> ${t.status}`);
                });

                const deviationsLayer = L.layerGroup();
                deviationsData.forEach(d => {
                    L.marker([d.lat, d.lng], { icon: deviationIcon }).addTo(deviationsLayer)
                     .bindPopup(`<b>Deviation Alert</b><br>Truck: ${d.truck}`);
                });

                const reportsLayer = L.layerGroup();
                reportsData.forEach(r => {
                     L.marker([r.lat, r.lng], { icon: reportIcon }).addTo(reportsLayer)
                     .bindPopup(`<b>Citizen Report</b><br>Type: ${r.type}`);
                });
                
                trucksLayer.addTo(map);
                deviationsLayer.addTo(map);
                reportsLayer.addTo(map);

                const overlayMaps = {
                    "Active Trucks": trucksLayer,
                    "Route Deviations": deviationsLayer,
                    "Citizen Reports": reportsLayer
                };

                L.control.layers(null, overlayMaps, { collapsed: false }).addTo(map);

                document.getElementById('deviation-card').addEventListener('click', () => {
                    if(deviationsLayer.getLayers().length > 0) {
                        map.fitBounds(deviationsLayer.getBounds(), { padding: [50, 50] });
                    }
                });
            };

            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetTab = tab.getAttribute('data-tab');
                    tabs.forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    tabContents.forEach(content => {
                        content.classList.remove('active');
                        if (content.id === `${targetTab}-content`) {
                            content.classList.add('active');
                            if (targetTab === 'admin') {
                                initMap();
                                setTimeout(() => map.invalidateSize(), 100);
                            }
                            if (targetTab === 'worker') {
                                renderWorkerTasks();
                                displayTaskDetails(1);
                            }
                        }
                    });
                });
            });

            if(document.querySelector('#admin-content').classList.contains('active')) {
                initMap();
            }

            const chartData = {
                '3m': {
                    labels: ['Jun', 'Jul', 'Aug'],
                    diversion: { datasets: [{ label: 'Landfill', data: [120, 110, 115], backgroundColor: '#EF4444' },{ label: 'Recycling', data: [40, 45, 50], backgroundColor: '#3B82F6' },{ label: 'Biogas/RDF', data: [30, 35, 40], backgroundColor: '#22C55E' }] },
                    composition: { labels: ['Recycling', 'Biogas/RDF', 'Landfill'], datasets: [{ data: [26, 21, 53], backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'], borderColor: '#F8F9FA', borderWidth: 2 }] },
                    reports: { labels: ['Jun', 'Jul', 'Aug'], datasets: [{ label: 'Reported', data: [45, 60, 55], borderColor: '#F97316', tension: 0.1, fill: false }, { label: 'Resolved', data: [40, 52, 54], borderColor: '#166534', tension: 0.1, fill: false }] },
                    performance: { labels: ['Collection %', 'On-Time %', 'Diversion %', 'Low Complaints', 'Efficiency'], datasets: [{ label: 'Ward A', data: [95, 85, 70, 75, 80], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6', pointBackgroundColor: '#3B82F6'}, { label: 'Ward B', data: [88, 92, 65, 80, 85], backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E', pointBackgroundColor: '#22C55E'}] },
                    stats: { co2: 1450, kwh: 89300, deviations: 12 }
                },
                '6m': {
                    labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    diversion: { datasets: [{ label: 'Landfill', data: [150, 140, 130, 120, 110, 115], backgroundColor: '#EF4444' },{ label: 'Recycling', data: [30, 35, 38, 40, 45, 50], backgroundColor: '#3B82F6' },{ label: 'Biogas/RDF', data: [20, 22, 28, 30, 35, 40], backgroundColor: '#22C55E' }] },
                    composition: { labels: ['Recycling', 'Biogas/RDF', 'Landfill'], datasets: [{ data: [23, 17, 60], backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'], borderColor: '#F8F9FA', borderWidth: 2 }] },
                    reports: { labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'], datasets: [{ label: 'Reported', data: [50, 55, 52, 45, 60, 55], borderColor: '#F97316', tension: 0.1, fill: false }, { label: 'Resolved', data: [48, 53, 50, 40, 52, 54], borderColor: '#166534', tension: 0.1, fill: false }] },
                    performance: { labels: ['Collection %', 'On-Time %', 'Diversion %', 'Low Complaints', 'Efficiency'], datasets: [{ label: 'Ward A', data: [92, 88, 68, 72, 81], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6', pointBackgroundColor: '#3B82F6'}, { label: 'Ward B', data: [85, 90, 68, 82, 86], backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E', pointBackgroundColor: '#22C55E'}] },
                    stats: { co2: 2980, kwh: 185400, deviations: 25 }
                },
                '1y': {
                    labels: ['Sep', 'Nov', 'Jan', 'Mar', 'May', 'Jul'],
                    diversion: { datasets: [{ label: 'Landfill', data: [180, 175, 160, 150, 130, 110], backgroundColor: '#EF4444' },{ label: 'Recycling', data: [20, 25, 28, 30, 38, 45], backgroundColor: '#3B82F6' },{ label: 'Biogas/RDF', data: [10, 12, 15, 20, 28, 35], backgroundColor: '#22C55E' }] },
                    composition: { labels: ['Recycling', 'Biogas/RDF', 'Landfill'], datasets: [{ data: [18, 12, 70], backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'], borderColor: '#F8F9FA', borderWidth: 2 }] },
                    reports: { labels: ['Sep', 'Nov', 'Jan', 'Mar', 'May', 'Jul'], datasets: [{ label: 'Reported', data: [60, 65, 70, 50, 52, 60], borderColor: '#F97316', tension: 0.1, fill: false }, { label: 'Resolved', data: [58, 62, 68, 48, 50, 58], borderColor: '#166534', tension: 0.1, fill: false }] },
                    performance: { labels: ['Collection %', 'On-Time %', 'Diversion %', 'Low Complaints', 'Efficiency'], datasets: [{ label: 'Ward A', data: [90, 85, 65, 70, 78], backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: '#3B82F6', pointBackgroundColor: '#3B82F6'}, { label: 'Ward B', data: [88, 88, 70, 85, 88], backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#22C55E', pointBackgroundColor: '#22C55E'}] },
                    stats: { co2: 6100, kwh: 395000, deviations: 58 }
                }
            };

            let diversionChart, compositionChart, citizenReportsChart, wardPerformanceChart;
            const diversionCtx = document.getElementById('diversionChart').getContext('2d');
            const compositionCtx = document.getElementById('compositionChart').getContext('2d');
            const citizenReportsCtx = document.getElementById('citizenReportsChart').getContext('2d');
            const wardPerformanceCtx = document.getElementById('wardPerformanceChart').getContext('2d');

            function createOrUpdateCharts(period) {
                const data = chartData[period];
                document.getElementById('co2-stat').textContent = data.stats.co2.toLocaleString();
                document.getElementById('kwh-stat').textContent = data.stats.kwh.toLocaleString();
                document.getElementById('deviation-stat').textContent = data.stats.deviations.toLocaleString();
                
                if (diversionChart) {
                    diversionChart.data.labels = data.labels;
                    diversionChart.data.datasets = data.diversion.datasets;
                    diversionChart.update();
                } else {
                    diversionChart = new Chart(diversionCtx, {
                        type: 'bar',
                        data: { labels: data.labels, datasets: data.diversion.datasets },
                        options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Waste (in Tons)' } } }, plugins: { title: { display: true, text: 'Waste Diversion Over Time', font: { size: 16 } } } }
                    });
                }
                
                if (compositionChart) {
                    compositionChart.data.datasets[0].data = data.composition.datasets[0].data;
                    compositionChart.update();
                } else {
                    compositionChart = new Chart(compositionCtx, {
                        type: 'doughnut',
                        data: data.composition,
                        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Waste Composition', font: { size: 16 } }, legend: { position: 'top' } }, cutout: '60%' }
                    });
                }

                if (citizenReportsChart) {
                    citizenReportsChart.data.labels = data.reports.labels;
                    citizenReportsChart.data.datasets = data.reports.datasets;
                    citizenReportsChart.update();
                } else {
                    citizenReportsChart = new Chart(citizenReportsCtx, {
                        type: 'line',
                        data: data.reports,
                        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Citizen Reports vs. Resolutions', font: { size: 16 } } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'Number of Tickets' } } } }
                    });
                }

                if (wardPerformanceChart) {
                    wardPerformanceChart.data.datasets = data.performance.datasets;
                    wardPerformanceChart.update();
                } else {
                    wardPerformanceChart = new Chart(wardPerformanceCtx, {
                        type: 'radar',
                        data: data.performance,
                        options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Ward Performance Metrics', font: { size: 16 } } }, scales: { r: { beginAtZero: true, max: 100 } } }
                    });
                }
            }
            
            const filterButtons = document.querySelectorAll('#chart-filter button');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const period = button.dataset.period;
                    createOrUpdateCharts(period);
                    filterButtons.forEach(btn => btn.classList.remove('bg-white', 'text-green-700', 'shadow'));
                    button.classList.add('bg-white', 'text-green-700', 'shadow');
                });
            });

            function animateValue(obj, start, end, duration) {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    const value = progress * (end - start) + start;
                    obj.innerHTML = end % 1 !== 0 ? value.toFixed(1) : Math.floor(value).toLocaleString();
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const target = +el.getAttribute('data-target');
                        animateValue(el, 0, target, 1500);
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.5 });
            
            document.querySelectorAll('.animated-stat').forEach(stat => {
                observer.observe(stat);
            });

            createOrUpdateCharts('6m');

            const workerTasks = [
                { id: 1, title: "Morning Route - Ward 12B", status: "In Progress", description: "Standard morning collection route for all designated bins in Ward 12B. Ensure segregation at source is maintained.", type: "route", mapData: { center: [28.4744, 77.5038], zoom: 14 } },
                { id: 2, title: "Bulk Pickup - Central Market", status: "Pending", description: "Collect large volume organic waste from Central Market vendor area. Vehicle: UP78-C9012.", type: "pickup", mapData: { center: [28.465, 77.498], zoom: 16 } },
                { id: 3, title: "Resolve Ticket #TKT-0905-003", status: "Pending", description: "Citizen report of overflowing bin near Jagat Farm. Photo proof of resolution required.", type: "ticket", mapData: { center: [28.484, 77.513], zoom: 17 } },
                { id: 4, title: "Vehicle Maintenance Check", status: "Completed", description: "Daily pre-shift vehicle inspection completed and logged.", type: "maintenance" }
            ];

            const taskList = document.getElementById('task-list');
            const taskTitle = document.getElementById('task-title');
            const taskStatusBadge = document.getElementById('task-status-badge');
            const taskIdDisplay = document.getElementById('task-id-display');
            const taskDescription = document.getElementById('task-description');
            const taskActions = document.getElementById('task-actions');
            const workerMapContainer = document.getElementById('worker-map-container');

            function renderWorkerTasks() {
                taskList.innerHTML = '';
                workerTasks.forEach(task => {
                    const li = document.createElement('li');
                    li.className = 'task-item p-4 bg-white rounded-lg shadow-sm border-l-4 cursor-pointer transition';
                    li.dataset.taskId = task.id;

                    const statusClasses = {
                        'In Progress': 'border-blue-500',
                        'Pending': 'border-yellow-500',
                        'Completed': 'border-green-500'
                    };
                    li.classList.add(statusClasses[task.status]);
                    
                    li.innerHTML = `
                        <div class="flex justify-between items-center">
                            <p class="font-semibold text-gray-800">${task.title}</p>
                            <span class="text-xs font-bold">${task.status}</span>
                        </div>
                    `;
                    li.addEventListener('click', () => displayTaskDetails(task.id));
                    taskList.appendChild(li);
                });
            }

            function displayTaskDetails(taskId) {
                const task = workerTasks.find(t => t.id === taskId);
                if (!task) return;

                document.querySelectorAll('.task-item').forEach(item => {
                    item.classList.toggle('active', parseInt(item.dataset.taskId) === taskId);
                });

                taskTitle.textContent = task.title;
                taskIdDisplay.textContent = `Task ID: ${String(task.id).padStart(4, '0')}`;
                taskDescription.textContent = task.description;

                const statusClasses = {
                    'In Progress': 'bg-blue-100 text-blue-800',
                    'Pending': 'bg-yellow-100 text-yellow-800',
                    'Completed': 'bg-green-100 text-green-800'
                };
                taskStatusBadge.className = `text-xs font-medium px-2 py-1 rounded-full ${statusClasses[task.status]}`;
                taskStatusBadge.textContent = task.status;

                taskActions.innerHTML = '';
                if(task.status === 'Pending') {
                    taskActions.innerHTML = '<button class="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Start Task</button>';
                } else if(task.status === 'In Progress') {
                    taskActions.innerHTML = '<button class="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Mark as Complete</button>';
                }

                if (task.mapData) {
                    workerMapContainer.style.display = 'block';
                    if (!workerMapInitialized) {
                        workerMap = L.map('worker-map-container');
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(workerMap);
                        workerMapInitialized = true;
                    }
                    workerMap.setView(task.mapData.center, task.mapData.zoom);
                    L.marker(task.mapData.center).addTo(workerMap).bindPopup(task.title).openPopup();
                    setTimeout(() => workerMap.invalidateSize(), 100);

                } else {
                    workerMapContainer.style.display = 'none';
                }
            }

        
        

        
    

        });
    