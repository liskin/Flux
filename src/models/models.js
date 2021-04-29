import { xf, exists, equals, first, second, last, inRange, fixInRange, dateToDashString } from '../functions.js';
import { LocalStorageItem } from '../storage/local-storage.js';
import { IDB } from '../storage/idb.js';
import { workouts } from '../workouts/workouts.js';
import { zwo } from '../workouts/parser.js';
import { fileHandler } from '../file.js';
import { Encode } from '../ant/fit.js';

class Model {
    constructor(args) {
        this.prop = args.prop;
        this.default = args.default || this.defaultValue();
        this.prev = args.default;
        this.set = args.set || this.defaultSet;
        this.isValid = args.isValid || this.defaultIsValid;
        this.onInvalid = args.onInvalid || this.defaultOnInvalid;
        this.storage = this.defaultStorage();
        this.init();
        this.postInit(args);
    }
    init() { return; }
    postInit() { return; }
    defaultValue() { return ''; }
    defaultIsValid(value) { return exists(value); }
    defaultSet(value) {
        const self = this;
        if(self.isValid(value)) {
            return value;
        } else {
            self.defaultOnInvalid(value);
            return self.default;
        }
    }
    defaultOnInvalid(x) {
        const self = this;
        console.error(`Trying to set invalid ${self.prop}. ${typeof x}`, x);
    }
    defaultStorage() {
        const self = this;
        return {set: ((x)=>x),
                restore: ((_)=> self.default)};
    }
    backup(value) {
        const self = this;
        self.storage.set(value);
    }
    restore() {
        const self = this;
        return self.storage.restore();
    }
}

class Power extends Model {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 2500;
    }
    defaultValue() { return 0; }
    defaultIsValid(value) {
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
}

class HeartRate extends Model {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 255;
    }
    defaultValue() { return 0; }
    defaultIsValid(value) {
        const self = this;
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
}

class Cadence extends Model {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 255;
    }
    defaultValue() { return 0; }
    defaultIsValid(value) {
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
}

class Speed extends Model {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 120;
    }
    defaultValue() { return 0; }
    defaultIsValid(value) {
        return (Number.isInteger(value) || Number.isFloat(value)) &&
            inRange(self.min, self.max, value);
    }
}

class Distance extends Model {
    postInit(args) {}
    defaultValue() { return 0; }
    defaultIsValid(value) {
        return Number.isInteger(value) || Number.isFloat(value);
    }
}

class Target extends Model {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 100;
        this.step = args.step || 1;
    }
    defaultValue() { return 0; }
    defaultIsValid(value) {
        const self = this;
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
    defaultSet(value) {
        const self = this;
        if(isNaN(value)) {
            self.onInvalid();
            return self.default;
        }
        return fixInRange(self.min, self.max, self.parse(value));
    }
    parse(value) { return parseInt(value); }
    inc(value) {
        const self = this;
        const x = value + self.step;
        return self.set(x);
    }
    dec(value) {
        const self = this;
        const x = value - self.step;
        return self.set(x);
    }
}

class PowerTarget extends Target {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 800;
        this.step = args.step || 10;
    }
}

class ResistanceTarget extends Target {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 100;
        this.step = args.step || 10;
    }
}

class SlopeTarget extends Target {
    postInit(args) {
        this.min = args.min || 0;
        this.max = args.max || 45;
        this.step = args.step || 0.5;
    }
    defaultIsValid(value) {
        const self = this;
        return Number.isFloat(value) && inRange(self.min, self.max, value);
    }
    parse(value) { return parseFloat(value); }
}

class Mode extends Model {
    postInit(args) {
        this.values = ['erg', 'resistance', 'slope'];
    }
    defaultValue() { return 'erg'; }
    defaultIsValid(value) { return this.values.includes(value); }
}

class Page extends Model {
    postInit(args) {
        this.values = ['settings', 'home', 'workouts'];
    }
    defaultValue() { return 'home'; }
    defaultIsValid(value) { return this.values.includes(value); }
}

class FTP extends Model {
    postInit(args) {
        const self = this;
        const storageModel = {
            key: self.prop,
            default: self.defaultValue(),
        };
        self.min = args.min || 0;
        self.max = args.max || 500;
        self.storage = new args.storage(storageModel);
    }
    defaultValue() { return 200; }
    defaultIsValid(value) {
        const self = this;
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
}

class Weight extends Model {
    postInit(args) {
        const self = this;
        const storageModel = {
            key: self.prop,
            default: self.defaultValue(),
        };
        self.min = args.min || 0;
        self.max = args.max || 500;
        self.storage = new args.storage(storageModel);
    }
    defaultValue() { return 75; }
    defaultIsValid(value) {
        const self = this;
        return Number.isInteger(value) && inRange(self.min, self.max, value);
    }
}
class Theme extends Model {
    postInit(args) {
        const self = this;
        const storageModel = {
            key: self.prop,
            default: self.defaultValue(),
        };
        self.storage = new args.storage(storageModel);
        self.values = ['dark', 'light'];
    }
    defaultValue() { return 'dark'; }
    defaultIsValid(value) { return this.values.includes(value); }
    switch(theme) {
        const self = this;
        if(theme === first(self.values)) return second(self.values);
        if(theme === second(self.values)) return first(self.values);
        self.onInvalid(theme);
        return self.default;
    }
}
class Measurement extends Model {
    postInit(args) {
        const self = this;
        const storageModel = {
            key: self.prop,
            default: self.defaultValue(),
        };
        self.storage = new args.storage(storageModel);
        self.values = ['metric', 'imperial'];
    }
    defaultValue() { return 'metric'; }
    defaultIsValid(value) { return this.values.includes(value); }
    switch(theme) {
        const self = this;
        if(theme === first(self.values)) return second(self.values);
        if(theme === second(self.values)) return first(self.values);
        self.onInvalid(theme);
        return self.default;
    }
}

class Workout extends Model {
    postInit(args) {
        const self = this;
        // const storageModel = {
        //     key: self.prop,
        //     default: self.defaultValue(),
        // };
        // self.storage = new args.storage(storageModel);
    }
    defaultValue() { return this.parse((first(workouts)).xml); }
    defaultIsValid(value) {
        return exists(value);
    }
    parse(workout) {
        return zwo.parse(workout);
    }
    fileName () {
        const self = this;
        const now = new Date();
        return `workout-${dateToDashString(now)}.fit`;
    }
    encode(db) {
        const self = this;
        let activity = Encode({data: db.records, laps: db.laps});
        return activity;
    }
    download(activity) {
        const self = this;
        const blob = new Blob([activity], {type: 'application/octet-stream'});
        fileHandler.saveFile()(blob, self.fileName());
    }
    save(db) {
        const self = this;
        self.download(self.encode(db));
    }
}

const power = new Power({prop: 'power'});
const heartRate = new HeartRate({prop: 'heartRate'});
const cadence = new Cadence({prop: 'cadence'});
const speed = new Speed({prop: 'speed'});
const distance = new Distance({prop: 'distance'});

const powerTarget = new PowerTarget({prop: 'powerTarget'});
const resistanceTarget = new ResistanceTarget({prop: 'resistanceTarget'});
const slopeTarget = new SlopeTarget({prop: 'slopeTarget'});
const mode = new Mode({prop: 'mode'});
const page = new Page({prop: 'page'});

const ftp = new FTP({prop: 'ftp', storage: LocalStorageItem});
const weight = new Weight({prop: 'weight', storage: LocalStorageItem});
const theme = new Theme({prop: 'theme', storage: LocalStorageItem});
const measurement = new Measurement({prop: 'measurement', storage: LocalStorageItem});

const workout = new Workout({prop: 'workout'});

let models = { power,
               heartRate,
               cadence,
               speed,
               powerTarget,
               resistanceTarget,
               slopeTarget,
               mode,
               page,
               ftp,
               weight,
               theme,
               measurement,
               workout
             };

export { models };
