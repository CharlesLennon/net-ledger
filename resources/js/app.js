import './bootstrap';
import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js'; // Import specific exports

window.LGraph = LGraph; // Expose LGraph to the global scope
window.LGraphCanvas = LGraphCanvas; // Expose LGraphCanvas to the global scope
window.LiteGraph = LiteGraph; // Expose the main LiteGraph object to the global scope
