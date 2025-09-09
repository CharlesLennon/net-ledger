(function () {
	'use strict';

	window.FEATURES = {
        locationsAsGroups: true,
        devicesAsNodes: true,
        servicesAsNodes: true,
        pciCardsAsNodes: true,
	};

	const FEATURE_LOADER = {
		loadedModules: [],

		loadIfEnabled: function (featureName, scriptPath) {
			if (window.FEATURES[featureName]) {
				if (window[this.getClassName(featureName)]) {
					this.addToLoadedModules(featureName, 'Already Loaded', true);
					return;
				}

				const script = document.createElement('script');
				script.src = scriptPath;
				script.onload = () => {
					setTimeout(() => {
						this.addToLoadedModules(featureName, 'Loaded Successfully', true);
					}, 50);
				};
				script.onerror = () => {
					console.error(`❌ Failed to load feature: ${featureName}`);
					this.addToLoadedModules(featureName, 'Failed to Load', false);
					window.FEATURES[featureName] = false;
				};
				document.head.appendChild(script);
			} else {
				this.addToLoadedModules(featureName, 'Disabled', false);
			}
		},

        addToLoadedModules: function(featureName, status, success) {
            this.loadedModules.push({
                'FeatureName': featureName,
                'Status': status,
                'Available': success ? '✅' : '❌',
                'Class': this.getClassName(featureName)
            });
        },

        getClassName: function (featureName) {
            return featureName.charAt(0).toUpperCase() + featureName.slice(1);
        },

        isAvailable: function (featureName) {
            return (
                window.FEATURES[featureName] && window[this.getClassName(featureName)] !== undefined
            );
        },

	};

	window.FEATURE_LOADER = FEATURE_LOADER;

	document.addEventListener('DOMContentLoaded', function () {
		const mapperFiles = {
			// dotMapper: '/js/features/mappers/dot.js',
            locationsAsGroups: '/js/features/locationsAsGroups.js',
            devicesAsNodes: '/js/features/devicesAsNodes.js',
            servicesAsNodes: '/js/features/servicesAsNodes.js',
            pciCardsAsNodes: '/js/features/pciCardsAsNodes.js',
		};

		Object.entries(mapperFiles).forEach(([featureName, filePath]) => {
			FEATURE_LOADER.loadIfEnabled(featureName, filePath);
		});

		function runInitWhenReady() {
			let allLoaded = true;
			
			for (const featureName in window.FEATURES) {
				if (window.FEATURES[featureName] && !FEATURE_LOADER.isAvailable(featureName)) {
					allLoaded = false;
					break;
				}
			}
			
			if (allLoaded) {				
				for (const featureName in window.FEATURES) {
					if (FEATURE_LOADER.isAvailable(featureName)) {
						const FeatureClass = window[FEATURE_LOADER.getClassName(featureName)];
						if (FeatureClass && typeof FeatureClass.onInit === 'function') {
							FeatureClass.onInit();
						}
					}
				}

				const allFeaturesInitEvent = new CustomEvent('allFeaturesInitialized', {
					detail: {
						loadedFeatures: FEATURE_LOADER.loadedModules,
						timestamp: Date.now(),
						availableFeatures: Object.keys(window.FEATURES).filter(name => 
							FEATURE_LOADER.isAvailable(name)
						)
					}
				});
				
				document.dispatchEvent(allFeaturesInitEvent);
			} else {
				setTimeout(runInitWhenReady, 100);
			}
		}
		setTimeout(runInitWhenReady, 100);
    });
})();
