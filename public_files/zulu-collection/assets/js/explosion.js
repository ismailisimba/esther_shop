(function () {
    var s = function (p) {
        var numWalkers;
        var fr = 60;
        var walkers = [];
        var stage;
        var hueColor;
        var bgHue;
        var shadow;
        var origin;
        var reset = true;
        var cnv;
        var name = 'explosion';
        var dataHsb = document.body.dataset.hsb.split(' ');
        var localWindowWidth = window.innerWidth;

        p.setup = function () {
            p.pixelDensity(1);

            // Create Stage
            stage = p.createVector(window.innerWidth, document.body.offsetHeight);
            cnv = p.createCanvas(stage.x, stage.y);
            cnv.id(name);
            cnv.class(name);
            cnv.parent(name + '-container');

            p.frameRate(fr);

            // Setup walkers
            numWalkers = p.random(50, 200);

            // Set Background
            hueColor = +dataHsb[0]; //p.random(0, 360);
            p.colorMode(p.HSB);
            p.background(+dataHsb[0], +dataHsb[1], +dataHsb[2]);

            // Create Walkers
            for (i = 0; i < numWalkers; i++) {
                walkers[i] = new Walker();
            }
        };

        p.resetCanvas = function () {
            p.clear();
        };

        p.draw = function () {
            for (i = 0; i < numWalkers; i++) {
                walkers[i].display();
                walkers[i].update();
            }
        };

        p.windowResized = function () {
            if (window.innerWidth !== localWindowWidth) {
                localWindowWidth = window.innerWidth;
                p.resizeCanvas(window.innerWidth, document.body.offsetHeight);
                p.clear();
                p.setup();
            }
        };

        function Walker() {
            // Set Properties
            this.pos = p.createVector(p.width / 2, p.height / 2);
            this.vel = p.createVector(0, 0);
            this.acc = p.createVector(p.random(p.random(-.05, .05), p.random(-.3, .3)), p.random(p.random(-.05, .05), p.random(-.3, .3)));
            this.decay = p.random(.5, 2); // Rate at which walkers shrink
            this.colorAngle = hueColor + p.random(-80, 80);
            this.sat = p.random(70, 80);
            this.light = p.random(60, 80);
            this.shadow = p.createVector(-this.acc.x, -this.acc.y);

            if (stage.x >= stage.y) {
                this.size = p.random(p.width * .02, p.width * .07);
                this.speed = p.random(p.width * .0032, p.width * .012);
            } else {
                this.size = p.random(p.height * .02, p.height * .07);
                this.speed = p.random(p.height * .0032, p.height * .012);
            }


            this.update = function () {
                var randomWalk = p.createVector(p.random(-this.speed, this.speed), p.random(-this.speed, this.speed));
                this.vel.add(this.acc.mult(1.005));
                this.pos.add(this.vel);
                this.pos.add(randomWalk);
                this.size -= this.decay;

                this.colorAngle += p.random(-.5, 1.5);
                if (this.colorAngle <= 0) {
                    this.colorAngle += 360;
                } else if (this.colorAngle >= 360) {
                    this.colorAngle -= 360;
                }

                this.light += .03;
                this.sat += .03;
            };

            this.display = function () {

                if (this.size <= 0) {
                    return;
                } else {
                    p.colorMode(p.HSB);

                    //Shadow
                    p.fill(this.colorAngle, this.sat, this.light);
                    p.noStroke();
                    p.ellipse(this.pos.x + this.shadow.x, this.pos.y + this.shadow.y, this.size, this.size);

                    // Circle
                    p.fill(this.colorAngle, this.sat, this.light);
                    p.noStroke();
                    p.ellipse(this.pos.x, this.pos.y, this.size, this.size);
                }
            }
        }
    };

    var myp5 = new p5(s);
})();
