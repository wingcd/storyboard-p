import GlowFilterPipeline from './glowfilterpipeline.js';

class GlowFilterPipelinePlugin extends Phaser.Plugins.BasePlugin {

    constructor(pluginManager) {
        super(pluginManager);
    }

    start() {
        var eventEmitter = this.game.events;
        eventEmitter.on('destroy', this.destroy, this);
    }

    add(scene, key, config) {
        return new GlowFilterPipeline(scene, key, config);
    }

}

export default GlowFilterPipelinePlugin;