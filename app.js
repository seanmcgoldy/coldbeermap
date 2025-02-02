const defaultCenter = { lat: 40.72040603274988, lng: -73.97026737617189 };

function initMap() {
    
    const mapOptions = {
        center: defaultCenter,
        zoom: 14,
        minZoom: 5,
        maxZoom: 18,
        mapId: 'd9a36f7f5d66b557',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
    };

    const map = new google.maps.Map(document.getElementById("map-container"), mapOptions);
    const markers = {};

    const input = document.getElementById('search-box');
    const searchBox = new google.maps.places.Autocomplete(input);
    searchBox.bindTo('bounds', map);

    const infoBubble = new InfoBubble({
        maxWidth: 500,
        minWidth: 238,
        minHeight: 420,
        maxHeight: 500,
        shadowStyle: 0,
        padding: 0,
        borderRadius: 10,
        arrowSize: 10,
        borderWidth: 1,
        backgroundColor: 'rgb(236, 247, 255)',
        hideCloseButton: false,
        arrowPosition: 50,
        arrowStyle: 0,
        Animation: null,
        disableAutoPan: true,
    });

    fetchData(map, markers, infoBubble);

    google.maps.event.addListener(map, 'click', () => {
        if (infoBubble.isOpen()) {
            infoBubble.close();
        }
    });

    applyFilter('all', markers);

    

    const filterButtons = document.querySelectorAll('.filter-button');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => applyFilter(button.getAttribute('data-category'), markers));
    });

    searchBox.addListener('place_changed', () => {
        const place = searchBox.getPlace();

        if (place.geometry) {
            map.setCenter(place.geometry.location);
            map.setZoom(14);

            prioritizeMarkers(place.geometry.location, markers);
        }
    });

    // Create and set up the reset button
    const resetButton = document.getElementById('reset-button');

    // Add event listener to reset button
    resetButton.addEventListener('click', () => {
        console.log('Reset button clicked');
        resetMapPosition(map, defaultCenter);
    });
}


// Define the resetMapPosition function
function resetMapPosition(map, defaultCenter) {
    map.setCenter(defaultCenter);
    map.setZoom(14);
}

function fetchData(map, markers, infoBubble) {
    //fetch("https://sheetdb.io/api/v1/26jtko1crvyzy")
    fetch("/data.json")
        .then(response => response.json())
        .then(data => {
            const bounds = new google.maps.LatLngBounds();

            data.forEach((place, index) => {
                const position = new google.maps.LatLng(place.lat, place.lon);
                bounds.extend(position);

                const iconUrl = `./img/${place.icon}.svg`;
                const iconSize = iconUrl.includes("heater") || iconUrl.includes("frozen") ?
                    new google.maps.Size(65, 65) : new google.maps.Size(26, 40);

                var existingMarker = markers[place.name];
                if (existingMarker) {
                    existingMarker.setPosition(position);
                } else {
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: {
                            url: iconUrl,
                            scaledSize: iconSize
                        },
                        title: place.name,
                    });

                    marker.category = place.filter;
                    markers[place.name] = marker;

                    // Inside the 'click' event listener for markers
                    google.maps.event.addListener(marker, 'click', () => {
                        const markerPosition = marker.getPosition();

                        // Use panTo for smoother movement
                        map.panTo(markerPosition);
                        map.panBy(0, -300);

                        // Open the infoBubble after the map has panned
                        google.maps.event.addListenerOnce(map, 'idle', () => {
                            infoBubble.setContent(getMarkerTemplate(place));
                            infoBubble.open(map, marker);

                            
                        });
                    });
                }
            });

            google.maps.event.addListener(window, "resize", () => {
                const center = map.getCenter();
                google.maps.event.trigger(map, "resize");
                map.setCenter(center);
            });
        })
        .catch(error => console.error("Error fetching data:", error));
}


function prioritizeMarkers(selectedLocation, markers) {
    for (const name in markers) {
        const marker = markers[name];
        const distance = google.maps.geometry.spherical.computeDistanceBetween(marker.getPosition(), selectedLocation);

        if (distance < 5000) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
        } else {
            marker.setAnimation(null);
        }
    }

    setTimeout(() => {
        for (const name in markers) {
            const marker = markers[name];
            marker.setAnimation(null);
        }
    }, 3000);
}

function applyFilter(category, markers) {
    const filterButtons = document.querySelectorAll('.filter-button');
    for (const button of filterButtons) {
        button.classList.remove('active');
    }

    const wrappingDivs = document.querySelectorAll('.overlay-content > div');
    for (const div of wrappingDivs) {
        div.classList.remove('active');
    }

    for (const name in markers) {
        const marker = markers[name];

        if (category === 'all') {
            marker.setVisible(true);
        } else if (
            (category === 'frozen' && marker.category === 'frozen') ||
            (category === 'draft1' && (marker.category === 'draft1' || marker.category === 'frozen' || marker.category === 'frostymug')) ||
            (category === 'frostymug' && marker.category === 'frostymug') ||
            (category === 'draft2' && marker.category === 'draft2') ||
            (category === 'draft3' && (marker.category === 'heater' || marker.category === 'draft3')) ||
            (category === 'heater' && marker.category === 'heater')
        ) {
            marker.setVisible(true);
            const correspondingDiv = document.querySelector(`.overlay-content > .legend${marker.legendNumber}`);
            if (correspondingDiv) {
                correspondingDiv.classList.add('active');
            }
        } else {
            marker.setVisible(false);
        }
    }

    const activeButton = document.querySelector(`.filter-button[data-category="${category}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
        const parentDiv = activeButton.closest('.overlay-content > div');
        if (parentDiv) {
            parentDiv.classList.add('active');
        }
    }
}

function getMarkerTemplate(place) {
    return `<div class="info-card">
        <div class="top-card">
            <img src="./img/highlights/${place.image}.jpg" alt="Beer Picture">
        </div>
        <div class="headline-container">
            <div class="headline">
                ${place.name}
            </div>
            <div class="inner-container">
            </div>
            <div class="description">${place.description}
            </div>    
            <div class="rating">
                <img src="https://coldbeermap.com/img/card-rating.png" alt="Rating">
                <span class="rating-text2">Rank</span>
                <span class="rating-text">#${place.arank}</span>
            </div>
        </div>    
        
        <div class="card-bar">
            <img src="https://coldbeermap.com/img/card-bar.jpg"></img>
        </div>
        <div class="details-container">
            <table>
                <tr>
                    <td>Beer:</td>
                    <td>${place.beer}</td>
                </tr>
                <tr>
                    <td>Temp:</td>
                    <td>${place.temp}</td>
                </tr>
                <tr>
                    <td>Style:</td>
                    <td>${place.style}</td>
                </tr>
                <tr>
                    <td>Producer:</td>
                    <td>${place.producer}</td>
                </tr>
            </table>
        </div>
    </div>`;
}


initMap();

