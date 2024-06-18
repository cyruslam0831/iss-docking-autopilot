// ---------------------------------------------------------------------------------------------------------------------------
// Variables
/*
const reading = {


    range: range,

    rateCurrent: rateCurrent,
    rateRotationX: rateRotationX,
    rateRotationY: rateRotationY,
    rateRotationZ: rateRotationZ,
    rateSmoothingFactor: rateSmoothingFactor,



    translationVector: translationVector,
    motionVector: motionVector,


}


let inputs = {
    rollLeft: rollLeft,
    rollRight: rollRight,

    pitchUp: picthUp,
    pitchDown: picthDown,

    yawnLeft: yawnLeft,
    yawnRight: yawnRight,

    translateForward:     translateForward,
    translateBackward:     translateBackward,
    translateUp: translateUp,
    translateDown: translateDown,
    translateLeft: translateLeft,
    translateRight: translateRight,
    translate: translate

}
*/

function getYaw() {
    let raw = document.getElementById("yaw").children[0].innerText
    return -parseFloat(raw.substring(0, raw.length - 1))
}

function getPitch() {
    let raw = document.getElementById("pitch").children[0].innerText
    return parseFloat(raw.substring(0, raw.length - 1))
}

function getRoll() {

    let raw = document.getElementById("roll").children[0].innerText
    return -parseFloat(raw.substring(0, raw.length - 1))
}


function getX(){

    let raw = document.getElementById("x-range").innerText
    return parseFloat(raw.substring(0, raw.length - 1))
}


function getY(){

    let raw = document.getElementById("y-range").innerText
    return parseFloat(raw.substring(0, raw.length - 1))
}

function getZ(){

    let raw = document.getElementById("z-range").innerText
    return parseFloat(raw.substring(0, raw.length - 1))
}

class Assistant {
    constructor(param = {}) {
        let { pc = 10, ic = 0, dc = 0, tv = 0, functionIncrease = null, functionDecrease = null, interval = 100 } = param;
        this.enabled = false;
        this.pc = pc; //Proportional coefficient
        this.ic = ic; //Integral coefficient
        this.dc = dc; //Derrivative coefficient
        this.tv = tv; //or setpoint
        this.lastError = 0;
        this.errorSum = 0;
        this.maxOutVal = 2; //max output
        this.minOutVal = -2; // min output
        this.functionIncrease = functionIncrease;
        this.functionDecrease = functionDecrease;
        this.getInput = null;
        this.interval = interval
        this.lastTime = null;

        return new Proxy(this, {

            get: function(target, prop) {
                if (!(prop in target)) throw new ReferenceError(`prop does not exist`)
                return Reflect.get(...arguments)
            },

            set: function(target, prop, value) {
                if (!(prop in target)) throw new ReferenceError(`prop does not exist`)
                return Reflect.set(...arguments)
            }
        })

    }

    compute (input) {
        let now = new Date();
        let deltaTime = (now - this.lastTime) * .001; //in seconds
        let error = this.tv - input;

        this.errorSum += (error * deltaTime)
        let dErr = (error - this.lastError) / deltaTime;

        this.lastError = error
        this.lastTime = now

        //console.log(`pc: ${this.pc}, ic ${this.ic}, dc: ${this.dc}, error: ${error}, dErr: ${dErr}, deltaTime: ${deltaTime}`);
        return this.pc * error + this.ic * this.errorSum + this.dc * dErr;
    }


    run() {
        let self = this
        if(this.enabled) return //already running
        this.enabled = true;
        if (this.functionIncrease === null || this.functionDecrease === null || this.getInput === null)
            throw new Error("Assistant is not initialized")
        this.lastTime = new Date()

        let runOnce = function(){
            if (document.getElementById("timer").innerText==="") {
                ap.disable()
            }

            let input = self.getInput()
            //console.log(`Input: ${input}`);
            let output = self.compute(input)
            //console.log(`Output: ${output}`);
            for (let i=0; i<self.normalizeOutput(Math.floor(Math.abs(output))); ++i ){
                output < 0 ? self.functionIncrease() : self.functionDecrease();
            }

            if(self.enabled) setTimeout(runOnce, self.interval);
        }

        runOnce()
    }

    stop(){
        this.enabled = false;
    }

    toggle(){
        if (this.enabled) {
            this.stop()
        } else {
            this.run()
        }
    }

    normalizeOutput(val){
        return val > this.maxOutVal ? this.maxOutVal : val
    }

    setTunings(pc, ic, dc) {
        this.pc = pc
        this.ic = ic
        this.dc = dc
    }



    setInterval(interval) {
        this.interval = interval;
    }

    setFunctionIncrease(fn) {
        this.functionIncrease = fn
    }

    setFunctionDecrease(fn) {
        this.functionDecrease = fn
    }

    setInputGetter(fn){
        this.getInput = fn;
    }
}



function prepareRollAssistant(){
    let res = new Assistant();
    res.setInputGetter(window.getRoll);
    res.setFunctionIncrease(window.rollRight);
    res.setFunctionDecrease(window.rollLeft);
    res.dc = 100
    return res;
}


function prepareYawAssistant(){
    let res = new Assistant();
    res.setInputGetter(getYaw);
    res.setFunctionIncrease(window.yawRight);
    res.setFunctionDecrease(window.yawLeft);
    res.dc = 100
    return res;
}
function preparePitchAssistant(){
    let res = new Assistant();
    res.setInputGetter(getPitch);
    res.setFunctionIncrease(window.pitchDown);
    res.setFunctionDecrease(window.pitchUp);
    res.dc = 100
    return res;
}


function prepareXAssistant(){
    let res = new Assistant();
    res.setInputGetter(getX);
    res.setFunctionIncrease(window.translateForward);
    res.setFunctionDecrease(window.translateBackward);
    res.dc = 130
    res.pc = 20
    res.tv = 0.5
    return res;
}
function prepareYAssistant(){
    let res = new Assistant();
    res.setInputGetter(getY);
    res.setFunctionIncrease(window.translateLeft);
    res.setFunctionDecrease(window.translateRight);
    res.dc = 100
    res.tv = 0.0
    return res;
}
function prepareZAssistant(){
    let res = new Assistant();
    res.setInputGetter(getZ);
    res.setFunctionIncrease(window.translateDown);
    res.setFunctionDecrease(window.translateUp);
    res.dc = 100
    res.tv = 0.0
    return res;
}

class Autopilot{
    constructor(){
        this.roll = prepareRollAssistant();
        this.pitch = preparePitchAssistant();
        this.yaw = prepareYawAssistant()
        this.x = prepareXAssistant()
        this.y = prepareYAssistant()
        this.z = prepareZAssistant()
        this.enabled = false
    }

    checkApproach(){
        //console.log("Checking Approach...")
        if (getX() < 3){
            if (ap.x.dc != 1600) {console.log("Phase II - Approach")}
            ap.x.dc = 1600
            ap.y.dc = 800
            ap.z.dc = 800
            if (Math.abs(getY()) < 0.2 && Math.abs(getZ()) < 0.2 && Math.abs(getPitch()) < 0.2 && Math.abs(getRoll()) < 0.2 && Math.abs(getYaw()) < 0.2 ) {
                ap.x.pc = ap.y.pc = ap.z.pc = ap.pitch.pc = ap.yaw.pc = ap.roll.pc = 2
            }
        } else if (getX() < 10) {
            if (ap.x.pc != 5) {console.log("Phase I - Pre-docking Speed Reduction")}
            ap.x.pc = 5
        }

        if (Math.abs(getY()) < 0.2 && Math.abs(getZ()) < 0.2 && Math.abs(getPitch()) < 0.2 && Math.abs(getRoll()) < 0.2 && Math.abs(getYaw()) < 0.2 ) {
            if (ap.x.tc != -0.5) {console.log("Phase III - Docking")}
            ap.x.tv = -0.5
        } else {
            ap.x.tv = 1
        }
        if (ap.enabled) setTimeout(ap.checkApproach, 1000);

    }


    disable(params = {}){

        let { roll=true, pitch=true, yaw=true, x=true, y=true, z=true } = params
        if (this.enabled) this.enabled = false;
    }

    enable(params = {}){
        let { roll=true, pitch=true, yaw=true, x=true, y=true, z=true } = params
        this.enabled = true
        this.checkApproach()
    }

    toggle(assistant){
        let assistants = {
            x: this.x,
            y: this.y,
            z: this.z,
            roll: this.roll,
            pitch: this.pitch,
            yaw: this.yaw
        }

        if(assistant in assistants){
            assistants[assistant].toggle();
        } else{
            console.log("Assistant does not exist");
        }

    }
}


let ap = new Autopilot();;

document.onkeyup = ev=>{
    switch(ev.key){
        case "f":
            if(ap.enabled){
                ap.x.stop()
                ap.y.stop()
                ap.z.stop()
                ap.roll.stop()
                ap.pitch.stop()
                ap.yaw.stop()
                ap.disable()
                break;
            } else {
                ap = new Autopilot();
                ap.enable()
                ap.x.run()
                ap.y.run()
                ap.z.run()
                ap.roll.run()
                ap.pitch.run()
                ap.yaw.run()
                console.log("Autopilot enabled")
            }
            break;
        case "y":
            ap.toggle("y")
            break;
        case "Y":
            ap.toggle("yaw")
            break;

        case "z":
            ap.toggle("z")
            break;
        case "x":
            ap.toggle("x")
            if (ap.x.enabled) {
                ap.disable()
            } else {
                ap.enable()
            }
            break;
        case "p":
            ap.toggle("pitch")
            break;
        case "r":
            ap.toggle("roll")
            break;    
        case "F":
            if(ap.enabled){
                ap.x.stop()
                ap.y.stop()
                ap.z.stop()
                ap.roll.stop()
                ap.pitch.stop()
                ap.yaw.stop()
                ap.disable()
                break;
            } else {
                ap = new Autopilot();
                ap.enable()
                ap.x.run()
                ap.y.run()
                ap.z.run()
                ap.roll.run()
                ap.pitch.run()
                ap.yaw.run()
                console.log("Autopilot enabled")
            }
            break;

        case "Z":
            ap.toggle("z")
            break;
        case "X":
            ap.toggle("x")
            if (ap.x.enabled) {
                ap.disable()
            } else {
                ap.enable()
            }
            break;
        case "P":
            ap.toggle("pitch")
            break;
        case "R":
            ap.toggle("roll")
            break;
    }
}
