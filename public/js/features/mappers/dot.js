/**
 * Navigation Dot Mapper - Self-contained feature for intelligent network navigation
 * Provides gap-aware navigation dots with collision detection and lane separation
 * 
 * Now includes NetworkManager lifecycle hook support!
 */
class DotMapper {
	constructor(config = {}) {
		this.config = {
			laneOffset: config.laneOffset || 20,
			verticalSpacing: config.verticalSpacing || 60,
			perimeterOffset: config.perimeterOffset || 30,
			collisionRadius: config.collisionRadius || 50,
			groupHorizontalGap: config.groupHorizontalGap || 150,
			canvasPadding: config.canvasPadding || 100,
			centeringOffset: config.centeringOffset || 40,
			gapDirection: config.gapDirection || true,
			minGapWidth: config.minGapWidth || 100,
			debugMode: config.debugMode || false,
			...config,
		};

		this.navigationDots = [];
		this.groupBoundaries = [];
		this.gaps = [];
		this.connections = [];
		this.stats = {
			totalDots: 0,
			collisionsRemoved: 0,
			gaps: 0,
			groups: 0
		};
	}

	static onInit() {
		console.log('DotMapper initialized');
	}

	static onConfigLoad(config = []) {
		config.push({
			name: 'Dot Mapper',
			feature: 'dotMapper',
			version: '1.0.0',
			description: 'Intelligent navigation dots for wire routing'
		});
		return config;
	}


			
}

if (typeof window !== 'undefined') {
	window.DotMapper = DotMapper;
}
