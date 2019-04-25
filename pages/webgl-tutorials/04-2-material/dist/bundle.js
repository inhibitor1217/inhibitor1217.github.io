/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/engine/components/Material.ts":
/*!*******************************************!*\
  !*** ./src/engine/components/Material.ts ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return Material; });\n/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! global */ \"./src/global.ts\");\n\nclass Material {\n    constructor(program) {\n        this._gl = global__WEBPACK_IMPORTED_MODULE_0__[\"default\"].get('gl');\n        this._program = program;\n        this._uniformLocations = {};\n    }\n    start() {\n        this._program.start();\n    }\n    stop() {\n        this._program.stop();\n    }\n    setColor(r, g, b) {\n        this._setUniform3f('color', r, g, b);\n    }\n    getProgram() { return this._program; }\n    _setUniform1f(variableName, v0) {\n        this._gl.uniform1f(this._getUniformLocation(variableName), v0);\n    }\n    _setUniform2f(variableName, v0, v1) {\n        this._gl.uniform2f(this._getUniformLocation(variableName), v0, v1);\n    }\n    _setUniform3f(variableName, v0, v1, v2) {\n        this._gl.uniform3f(this._getUniformLocation(variableName), v0, v1, v2);\n    }\n    _setUniform4f(variableName, v0, v1, v2, v3) {\n        this._gl.uniform4f(this._getUniformLocation(variableName), v0, v1, v2, v3);\n    }\n    _getUniformLocation(variableName) {\n        if (!this._uniformLocations[variableName])\n            this._uniformLocations[variableName] = this._gl.getUniformLocation(this._program.getProgram(), variableName);\n        return this._uniformLocations[variableName];\n    }\n}\n\n\n//# sourceURL=webpack:///./src/engine/components/Material.ts?");

/***/ }),

/***/ "./src/engine/components/Mesh.ts":
/*!***************************************!*\
  !*** ./src/engine/components/Mesh.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return Mesh; });\n/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! global */ \"./src/global.ts\");\n\nclass Mesh {\n    constructor() {\n        this._gl = global__WEBPACK_IMPORTED_MODULE_0__[\"default\"].get('gl');\n        this._vao = this._gl.createVertexArray();\n        this._vbo = this._gl.createBuffer();\n        this._ibo = this._gl.createBuffer();\n        this._count = 0;\n        this._drawMode = this._gl.TRIANGLES;\n        this._deleted = false;\n    }\n    updateVertexBuffer(buffer) {\n        if (this._deleted)\n            return;\n        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vbo);\n        this._gl.bufferData(this._gl.ARRAY_BUFFER, buffer, this._gl.STATIC_DRAW);\n        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);\n    }\n    updateIndexBuffer(buffer) {\n        if (this._deleted)\n            return;\n        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._ibo);\n        this._gl.bufferData(this._gl.ELEMENT_ARRAY_BUFFER, buffer, this._gl.STATIC_DRAW);\n        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, null);\n    }\n    configure(attributes) {\n        if (this._deleted)\n            return;\n        if (attributes.length == 0)\n            return;\n        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vbo);\n        this._gl.bindVertexArray(this._vao);\n        const type2size = (type) => {\n            if (type == this._gl.BYTE || type == this._gl.UNSIGNED_BYTE)\n                return 1;\n            if (type == this._gl.SHORT || type == this._gl.UNSIGNED_SHORT || type == this._gl.HALF_FLOAT)\n                return 2;\n            return 4;\n        };\n        const stride = attributes.map(([type, size]) => type2size(type) * size).reduce((s, x) => s + x);\n        let offset = 0;\n        for (const [index, [type, size]] of Object.entries(attributes)) {\n            this._gl.vertexAttribPointer(Number(index), size, type, false, stride, offset);\n            this._gl.enableVertexAttribArray(Number(index));\n            offset += type2size(type) * size;\n        }\n        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._ibo);\n        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);\n        this._gl.bindVertexArray(null);\n    }\n    start() {\n        if (this._deleted)\n            return;\n        this._gl.bindVertexArray(this._vao);\n    }\n    render() {\n        if (this._deleted)\n            return;\n        this._gl.drawElements(this._gl.TRIANGLES, this._count, this._gl.UNSIGNED_INT, 0);\n    }\n    stop() {\n        if (this._deleted)\n            return;\n        this._gl.bindVertexArray(null);\n    }\n    delete() {\n        if (this._deleted)\n            return;\n        this._gl.deleteBuffer(this._vbo);\n        this._gl.deleteBuffer(this._ibo);\n        this._gl.deleteVertexArray(this._vao);\n        this._deleted = true;\n    }\n    getDrawMode() { return this._drawMode; }\n    setDrawMode(drawMode) { this._drawMode = drawMode; }\n    getCount() { return this._count; }\n    setCount(count) { this._count = count; }\n    getVAO() { return this._vao; }\n    getVBO() { return this._vbo; }\n    getIBO() { return this._ibo; }\n}\n\n\n//# sourceURL=webpack:///./src/engine/components/Mesh.ts?");

/***/ }),

/***/ "./src/engine/shaders/DefaultShader.ts":
/*!*********************************************!*\
  !*** ./src/engine/shaders/DefaultShader.ts ***!
  \*********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return DefaultShader; });\n/* harmony import */ var engine_shaders_Program__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! engine/shaders/Program */ \"./src/engine/shaders/Program.ts\");\n\nconst vertexShaderSource = `#version 300 es\r\nlayout(location = 0) in vec2 position;\r\nvoid main() {\r\n    gl_Position = vec4(position, 0, 1);\r\n}\r\n`;\nconst fragmentShaderSource = `#version 300 es\r\nprecision mediump float;\r\nuniform vec3 color;\r\nout vec4 out_color;\r\nvoid main() {\r\n    out_color = vec4(color, 1);\r\n}\r\n`;\nclass DefaultShader extends engine_shaders_Program__WEBPACK_IMPORTED_MODULE_0__[\"default\"] {\n    constructor() {\n        super(vertexShaderSource, fragmentShaderSource);\n    }\n}\n\n\n//# sourceURL=webpack:///./src/engine/shaders/DefaultShader.ts?");

/***/ }),

/***/ "./src/engine/shaders/Program.ts":
/*!***************************************!*\
  !*** ./src/engine/shaders/Program.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return Program; });\n/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! global */ \"./src/global.ts\");\n\nclass Program {\n    constructor(vertexShaderSource, fragmentShaderSource) {\n        this._gl = global__WEBPACK_IMPORTED_MODULE_0__[\"default\"].get('gl');\n        this._vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);\n        this._gl.shaderSource(this._vertexShader, vertexShaderSource);\n        this._gl.compileShader(this._vertexShader);\n        if (!this._gl.getShaderParameter(this._vertexShader, this._gl.COMPILE_STATUS)) {\n            this._gl.deleteShader(this._vertexShader);\n            console.log(this._gl.getShaderInfoLog(this._vertexShader));\n            throw \"Error occurred while compiling vertex shader\";\n        }\n        this._fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);\n        this._gl.shaderSource(this._fragmentShader, fragmentShaderSource);\n        this._gl.compileShader(this._fragmentShader);\n        if (!this._gl.getShaderParameter(this._fragmentShader, this._gl.COMPILE_STATUS)) {\n            this._gl.deleteShader(this._vertexShader);\n            this._gl.deleteShader(this._fragmentShader);\n            console.log(this._gl.getShaderInfoLog(this._fragmentShader));\n            throw \"Error occurred while compiling fragment shader.\";\n        }\n        this._program = this._gl.createProgram();\n        this._gl.attachShader(this._program, this._vertexShader);\n        this._gl.attachShader(this._program, this._fragmentShader);\n        this._gl.linkProgram(this._program);\n        if (!this._gl.getProgramParameter(this._program, this._gl.LINK_STATUS)) {\n            this._gl.deleteProgram(this._program);\n            this._gl.deleteShader(this._vertexShader);\n            this._gl.deleteShader(this._fragmentShader);\n            console.log(this._gl.getProgramInfoLog(this._program));\n            throw \"Error occurred while linking shaders\";\n        }\n    }\n    start() {\n        if (!this._deleted)\n            this._gl.useProgram(this._program);\n    }\n    stop() {\n        if (!this._deleted)\n            this._gl.useProgram(null);\n    }\n    delete() {\n        if (this._deleted)\n            return;\n        this._gl.deleteProgram(this._program);\n        this._gl.deleteShader(this._vertexShader);\n        this._gl.deleteShader(this._fragmentShader);\n        this._deleted = true;\n    }\n    getProgram() { return this._program; }\n}\n\n\n//# sourceURL=webpack:///./src/engine/shaders/Program.ts?");

/***/ }),

/***/ "./src/global.ts":
/*!***********************!*\
  !*** ./src/global.ts ***!
  \***********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = ((() => {\n    const st = {};\n    return {\n        set: (key, object) => {\n            st[key] = object;\n        },\n        get: (key) => {\n            return st[key];\n        },\n        remove: (key) => {\n            delete st[key];\n        }\n    };\n})());\n\n\n//# sourceURL=webpack:///./src/global.ts?");

/***/ }),

/***/ "./src/main.ts":
/*!*********************!*\
  !*** ./src/main.ts ***!
  \*********************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! global */ \"./src/global.ts\");\n/* harmony import */ var engine_components_Mesh__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! engine/components/Mesh */ \"./src/engine/components/Mesh.ts\");\n/* harmony import */ var engine_shaders_DefaultShader__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! engine/shaders/DefaultShader */ \"./src/engine/shaders/DefaultShader.ts\");\n/* harmony import */ var engine_components_Material__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! engine/components/Material */ \"./src/engine/components/Material.ts\");\n\n\n\n\nconst canvas = document.getElementById('canvas');\nconst gl = canvas.getContext('webgl2');\nif (gl) {\n    /* Store WebGL Context to global storage. */\n    global__WEBPACK_IMPORTED_MODULE_0__[\"default\"].set('gl', gl);\n    /* Create mesh (a rectangle) using hard-coded data. */\n    const mesh = new engine_components_Mesh__WEBPACK_IMPORTED_MODULE_1__[\"default\"]();\n    mesh.updateVertexBuffer(new Float32Array([\n        -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5, -0.5\n    ]));\n    mesh.updateIndexBuffer(new Uint32Array([\n        0, 1, 3, 0, 3, 2\n    ]));\n    mesh.configure([[gl.FLOAT, 2]]);\n    mesh.setCount(6);\n    const defaultShader = new engine_shaders_DefaultShader__WEBPACK_IMPORTED_MODULE_2__[\"default\"]();\n    const material = new engine_components_Material__WEBPACK_IMPORTED_MODULE_3__[\"default\"](defaultShader);\n    /* glViewPort(x, y, width, height)\n     * Specifies the affine transform from normalized device coordinates\n     * to window coordinates. */\n    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);\n    /* Initialize frame buffer with color (0, 0, 0, 1). */\n    gl.clearColor(0, 0, 0, 1);\n    gl.clear(gl.COLOR_BUFFER_BIT);\n    /* Invoke the render call. */\n    mesh.start();\n    material.start();\n    material.setColor(1, 0, 0);\n    mesh.render();\n    mesh.stop();\n    material.stop();\n    mesh.delete();\n}\nelse {\n    console.log('WebGL not supported in this browser.');\n}\n\n\n//# sourceURL=webpack:///./src/main.ts?");

/***/ })

/******/ });