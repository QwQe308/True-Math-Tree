function checkAroundUpg(UPGlayer,place){
    return hasUpgrade(UPGlayer,place-1)||hasUpgrade(UPGlayer,place+1)||hasUpgrade(UPGlayer,place-10)||hasUpgrade(UPGlayer,place+10)
}
function getAPlimit(){
    ticks -= 1
    var limit = new ExpantaNum(50)
    if(ticks >= 0) return limit
    if(hasMilestone("t",9)) limit = limit.add(player.t.points)
    if(hasMilestone("a",8) && !hasMilestone("a",34)) limit = limit.pow((player.a.upgrades.length/5)**2+1)
    if(hasMilestone("a",34)) limit = limit.pow((player.a.upgrades.length/5+1)**5)
    if(hasUpgrade("a",11)) limit = limit.mul(upgradeEffect("a",11))
    if(hasUpgrade("a",24)) limit = limit.mul(upgradeEffect("a",24))
    limit = limit.mul(buyableEffect("a",11))
    if(limit.gt(1000)) limit = limit.cbrt().mul(1000**0.66)
    limit = logsoftcap(limit,e(1e20),e(hasMilestone("a",28)? 0.2:0.5))
    limit = logsoftcap(limit,e(1e35),e(0.4))
    //limit = logsoftcap(limit,e(1e50),e(0.1))
    //limit = powsoftcap(limit,e(1e35),e(3))
    limit = limit.root(player.t.nerf.APL)
    return limit.floor()
}
function AUMilestonekeep(){
    if(hasMilestone("a",11)) return player.a.milestones
    var kp = [0,7]
    if(hasMilestone("a",8)) kp.push(8)
    if(hasMilestone("a",9)) kp.push(9)
    if(hasMilestone("a",10)) kp.push(10)
    if(hasMilestone("a",12)) kp.push(12)
    if(hasMilestone("a",24)) kp.push(24)
    if(hasMilestone("a",26)) kp.push(26)
    if(hasMilestone("a",33)) kp.push(33)
    if(hasMilestone("a",34)) kp.push(34)
    if(hasMilestone("t",3)) kp.push(23)
    if(hasMilestone("t",10)) kp.push(14)
    if(hasMilestone("t",13)) kp.push(13)
    return kp
}
function getResetUGain(){
    var resetUgain = Math.max(player.a.upgrades.length-1,0)
    if(hasMilestone("a",13)) resetUgain = resetUgain**2
    if(hasMilestone("a",16)) resetUgain = resetUgain**1.25
    resetUgain = new OmegaNum(resetUgain)
    if(hasMilestone("a",21)) resetUgain = resetUgain.mul(player.a.points.add(10).log10().pow(0.75))
    if(inChallenge("a",12) || hasChallenge("a",12)) resetUgain = resetUgain.mul(logsoftcap(calcTickspeed().add(10).log10(),e(1000),e(0.2)))

    resetUgain = resetUgain.pow(tokenEffect(22))

    resetUgain = resetUgain.root(player.t.nerf.RAU)
    return resetUgain.floor()
}

function doACreset(resetToken = true,id = 11){
    if(resetToken) layerDataReset("t",[])
    var kp = [0,7,24]
    if(!hasMilestone("t",12) || player.t.tokens[id].lt(1)){
        if(hasMilestone("a",26)) kp.push(26)
        if(hasMilestone("a",33)) kp.push(33)
        if(hasMilestone("a",34)) kp.push(34)
        if(hasMilestone("t",3)) kp.push(23)
        if(hasMilestone("t",10)) kp.push(14)
        if(hasMilestone("t",13)) kp.push(13)
        player.a.milestones = kp
    }else if(player.t.tokens[id].gte(1) && hasMilestone("t",12)){
        if(!hasMilestone("a",11)) player.a.milestones.push(11)
    }
    for(i=2;i>=0;i--) rowReset(i,"a")
    player.points = zero
    player.a.points = zero
    player.a.pointbest = zero
    player.a.ppbest = zero
    if(player.t.tokens[id].lt(1) || !hasMilestone("t",12)){
        player.a.upgrades = []
        if(hasMilestone("t",2)) player.a.upgrades = [13]
        player.a.costmult = one
    }
    player.a.resetU = zero
    player.a.buyables[11] = zero
    player.a.buyables[12] = zero
    if(hasMilestone("t",1)&&!hasMilestone("a",4)) player.p.upgrades = [31,32,33,34,35]
    
}

function getRandomAuCostWithSeed(seed){
    return ten.pow(seed%6).mul(ten.pow(seed%4)).sqrt().mul(e(seed-30).pow(5)).pow(1.5)
}
function getRandomAuCostIncWithSeed(seed){
    return e(seed-30).mul(two.pow(seed%3+1).pow(seed%7+1).sqrt()).pow((seed/20-1)**0.25*1.25)
}


addLayer("a", {
    name: "arrow", // This is optional, only used in a few places, If absent it just uses the layer id.
    symbol: "A", // This appears on the layer's node. Default is the id with the first letter capitalized
    position: 0, // Horizontal position within a row. By default it uses the layer id and sorts in alphabetical order
    startData() { return {
        unlocked: false,
		points: new ExpantaNum(0),
        limitBest: new ExpantaNum(50),
        costmult: new ExpantaNum(1),
        pointbest: new ExpantaNum(0),
        ppbest: new ExpantaNum(0),
        resetU: new ExpantaNum(0),
        resetUsetting: false, 
        aausetting:false
    }},
    color: "lightblue",
    resource: "??????????????????(ap)", // Name of prestige currency
    baseResource: "pp",
    baseAmount() {return player.p.points},
    requires(){
        var req = new ExpantaNum(1e8)
        if(hasMilestone("a",0)) req = new ExpantaNum(1e10)
        return req
    },
    branches:["p"],
    type: "normal", // normal: cost to gain currency depends on amount gained. static: cost depends on how much you already have
    exponent: 0.125,
    gainMult() { // Calculate the multiplier for main currency from bonuses
        mult = new ExpantaNum(1)
        if(hasMilestone("a",13)) mult = mult.mul(upgradeEffect("a",24).cbrt())
        if(hasUpgrade("p",51)) mult = mult.mul(upgradeEffect("p",51))
        if(hasUpgrade("p",52)) mult = mult.mul(upgradeEffect("p",52))
        if(hasUpgrade("p",53)) mult = mult.mul(upgradeEffect("p",53))
        return mult
    },
    gainExp() { // Calculate the exponent on main currency from bonuses
        var exp = new ExpantaNum(1)
        if(hasMilestone("a",0)) exp = exp.mul(1.5)
        if(hasUpgrade("a",25)) exp = exp.add(1)
        return exp
    },
    row: 3, // Row the layer is in on the tree (0 is the first row)  QwQ:1?????????????????????
    layerShown(){return hasUpgrade("p",25)||player.a.unlocked},
    effect1(){
        var p = hasMilestone("a",7) ? player[this.layer].best : player[this.layer].points
        if(hasUpgrade("p",61)) p = p.mul(player[this.layer].points)
        var eff = p.mul(10).add(1).root(8)
        //if(inChallenge("a",22)) eff = one
        //if(eff.gte(4)) eff = eff.sqrt().mul(2)
        return eff
    },
    effect2(){
        var p = hasMilestone("a",7) ? player[this.layer].best : player[this.layer].points
        if(hasUpgrade("p",61)) p = p.mul(player[this.layer].points)
        var eff = p.mul(10).add(1).root(8)
        //if(inChallenge("a",22)) eff = one
        //if(eff.gte(4)) eff = eff.sqrt().mul(2)
        return eff
    },    
    effect3(){
        var p = hasMilestone("a",7) ? player[this.layer].best : player[this.layer].points
        if(hasUpgrade("p",61)) p = p.mul(player[this.layer].points)
        var eff = p.mul(10).add(1).root(8).pow(12.56)
        if(hasMilestone("a",1)) eff = eff.pow(player.p.points.add(1).log10().add(1).log10().add(1).pow(2))
        //if(eff.gte(4)) eff = eff.sqrt().mul(2)
        if(hasMilestone("a",0)) eff = eff.mul(10)
        //if(inChallenge("a",22)) eff = one
        return eff
    },
    effect4(){
        var eff = this.effect3()
        eff = eff.add(1).log10().add(1).pow(4).div(1000).add(1)
        //if(eff.gte(4)) eff = eff.sqrt().mul(2)
        //if(inChallenge("a",22)) eff = one
        return eff
    },
    effect5(){
        var p = hasMilestone("a",7) ? player[this.layer].best : player[this.layer].points
        if(hasUpgrade("p",61)) p = p.mul(player[this.layer].points)
        var eff = p.div(10).add(10).log10().pow(0.75)
        //if(eff.gte(4)) eff = eff.sqrt().mul(2)
        //if(inChallenge("a",22)) eff = one
        return eff
    },
    effectDescription(){
        var eff0 = `<br>??????????????????${format(player.a.resetU)}???ap??????(ap??????13?????????)(RAU)<br>????????????ap???${format(player.a.best,0)}<br>??????ap?????????${format(getAPlimit(),0)}.`
        if(!hasMilestone("a",7)) eff0 = ``
        var eff1 = `<br>a -> Min(round(a*<text style = "color:green">${format(this.effect1(),2)}</text>),10)`
        if(hasMilestone("a",2)) eff1 = `<br>a -> Max(round(10/<text style = "color:green">${format(this.effect1(),2)}</text>),1)`
        var eff2 = `<br>cmax -> 0.5^(1/<text style = "color:green">${format(this.effect2(),2)}</text>)+1`
        var eff3 = `<br>P -> P*<text style = "color:green">${format(this.effect3())}</text>`
        if(hasMilestone("a",1)) eff3 = `<br>P -> P*<text style = "color:green">${format(this.effect1().pow(12.56))}</text>^(log10(log10(pp+1)+1)+1)^2(=${format(this.effect3())})`
        var eff4 = `<br>pp -> pp*${format(this.effect4())}`
        if(!hasMilestone("a",3)) eff4 = ""
        var eff5 = `<br>P -> P^<text style = "color:green">${format(this.effect5())}</text>`
        if(!hasMilestone("a",9)) eff5 = ""
        var eff6 = `<br>ap?????????14?????????ap??????x<text style = "color:orange">${format(upgradeEffect("a",24).cbrt(),2)}</text>`
        if(!hasMilestone("a",13)) eff6 = ``
        return eff0+eff1+eff2+eff3+eff4+eff5+eff6
    },
    clickables: {
        11: {
            canClick(){return hasMilestone("a",7)&&getResetUGain().gte(1)},
            display() {return `??????ap??????<br />?????????????????????a???,?????????${format(getResetUGain(),0)}??????????????????(RAU)<br /><br />????????????????????????:${format(player.a.costmult)}`},
            onClick(){                    
                var resetgain = getResetUGain()

                if(player.a.resetUsetting){
                    player.a.resetU = player.a.resetU.add(resetgain);
                    player.a.upgrades=[];player.a.points=player.a.points.max(e(50));player.a.costmult=new ExpantaNum(1);doReset(this.layer)
                    return
                }
                if(confirm("???????????????????????? ?????????????????????ap")){
                    player.a.resetU = player.a.resetU.add(resetgain);
                    player.a.upgrades=[];player.a.points=player.a.points.max(e(50));player.a.costmult=new ExpantaNum(1);doReset(this.layer)
                }
            }
        },
        12: {
            canClick(){return true/*hasMilestone("a",7)&&player.a.costmult.gt(1)*/},
            display() {return `??????????????????ap??????????????????<br /><br />????????????:${player.a.resetUsetting?"???":"???"}`},
            onClick(){player.a.resetUsetting=!player.a.resetUsetting}
        },
        //13: {
        //    canClick(){return hasMilestone("t",12)},
        //    display() {return `????????????ap??????<br /><br />????????????:${player.a.aausetting?"??????":"??????"}`},
        //    onClick(){player.a.aausetting=!player.a.aausetting}
        //},
    },
    //autoUpgrade(){return hasMilestone("t",12) && player.a.aausetting},
    upgrades: {
        11: {
            description(){return `??????????????????ap??????.(????????????)<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum(256).mul(player.a.costmult)},
            costinc(){return ExpantaNum(5).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",11)},
            effect(){
                var baseEff = player.a.pointbest.add(1).log10().add(1).log10().pow(2)
                if(hasUpgrade("a",31)) baseEff = baseEff.pow(upgradeEffect("a",31))
                //sc
                //if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("a",11),2)}`},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        12: {
            description(){return `??????e100???????????????(^0.25 -> ^0.33).<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum(50).mul(player.a.costmult)},
            costinc(){return ExpantaNum(1.25).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",12)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        13: {
            description(){return "????????????x.??????,???????????????????????????.??????31???????????????3???????????????????????????x,??????32?????????x10??????????????????x.<br><br>??????????????????:x1."},
            cost(){return new OmegaNum(50).mul(player.a.costmult)},
            costinc(){return ExpantaNum(1).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return hasMilestone("a",7)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        14: {
            description(){return `p??????sin??????????????????1.5.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum(75).mul(player.a.costmult)},
            costinc(){return ExpantaNum(1.5).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",14)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        15: {
            description(){return `??????1e18?????????????????????(^0.33 -> ^0.8).ap?????????1???'pp??????c???????????????/2'???????????????.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("256").mul(player.a.costmult)},
            costinc(){return ExpantaNum(4).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",15)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        21: {
            description(){return `pp1e20??????????????????.(^0.33 -> ^0.5)<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("308").mul(player.a.costmult)},
            costinc(){return ExpantaNum(3).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",21)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        22: {
            description(){return `??????????????????e100?????????.(^0.25->^0.33???^0.33->^0.5)<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("308").mul(player.a.costmult)},
            costinc(){return ExpantaNum(3).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",22)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        23: {
            description(){return `???????????????1000%???pp.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum(50).mul(player.a.costmult)},
            costinc(){return ExpantaNum(1).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",23)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        24: {
            description(){return `????????????????????????ap????????????ap??????.(?<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("308").mul(player.a.costmult)},
            costinc(){return ExpantaNum(2).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",24)},
            effect(){
                var baseEff = player.a.resetU.add(1).pow(1.5)
                //sc
                if(baseEff.gt(100)) baseEff = baseEff.root(4).mul(100**0.75)
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("a",24),1)}`},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        25: {
            description(){return `??????ap????????????.(^0.125->^0.25???^0.1875->0.3125)<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("308").mul(player.a.costmult)},
            costinc(){return ExpantaNum(2).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",25)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        31: {
            description(){return `??????ap??????au11.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("1024").mul(player.a.costmult)},
            costinc(){return ExpantaNum(25).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",31)&&hasMilestone("a",13)},
            effect(){
                var baseEff = player.a.best.pow(0.06)
                if(player.t.nerf.au31) baseEff = player.a.points.pow(0.06)
                baseEff = logsoftcap(baseEff,e(28),0.5)
                baseEff = logsoftcap(baseEff,e(60),0.5)
                return baseEff
            },
            effectDisplay(){return `^${format(upgradeEffect("a",31),1)}`},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        32: {
            description(){return `p34??????^1.5.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("128").mul(player.a.costmult)},
            costinc(){return ExpantaNum(1).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",32)&&hasMilestone("a",13)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        33: {
            description(){return `????????????^.??????????????????.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("1024").mul(player.a.costmult)},
            costinc(){return ExpantaNum(25).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",33)&&hasMilestone("a",13)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        34: {
            description(){return `??????pp???1e75????????????1e100.<br><br>??????????????????:x${format(this.costinc())}.`},
            cost(){return new OmegaNum("1024").mul(player.a.costmult)},
            costinc(){return ExpantaNum(10).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",34)&&hasMilestone("a",13)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        35: {
            description(){return `????????????ap?????????.??????????????????????????????.?????????????????????ap.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){return new OmegaNum("10086").mul(player.a.costmult)},
            costinc(){
                if(hasMilestone("a",34)) return one
                return ExpantaNum(1024).pow(player.t.nerf.APU)
            },//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",35)&&hasMilestone("a",13)},
            /*effect(){
                var baseEff = ten.pow(player.points.mul(100)).pow(2).sub(1).mul(100000).add(1)
                if(hasUpgrade("p",24)) baseEff = baseEff.pow(upgradeEffect("p",24))
                baseEff = baseEff.mul(buyableEffect("p",11))
                baseEff = baseEff.mul(buyableEffect("p",12))
                //sc
                if(baseEff.gt(10)) baseEff = baseEff.log10().pow(1.5).mul(10)
                if(baseEff.gt(100)) baseEff = baseEff.pow(0.2).mul(1000**0.8)
                if(baseEff.gt(1000)) baseEff = baseEff.pow(0.35).mul(1000**0.65)
                if(baseEff.gt(1e4)) baseEff = baseEff.log10().pow(2).mul(1e4/16)
                //p22:sin to p11
                if(hasUpgrade("p",22)) baseEff = baseEff.mul(upgradeEffect("p",22))
                return baseEff
            },
            effectDisplay(){return `x${format(upgradeEffect("p",11),1)}`}*/
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                if(!hasMilestone("a",24)) player.a.best=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        41: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        42: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        43: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        44: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        45: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        51: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        52: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        53: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        54: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        55: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        61: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        62: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        63: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        64: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        65: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        71: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        72: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        73: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        74: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        75: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        81: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        82: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        83: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        84: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        85: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        91: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        92: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        93: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        94: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        95: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        101: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        102: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        103: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        104: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        105: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        111: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        112: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        113: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        114: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        115: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        121: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        122: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        123: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        124: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
        125: {
            description(){return `?????????.<br><br>??????????????????:x${format(this.costinc())}.`} ,
            cost(){
                if(inChallenge("a",22) || hasChallenge("a",22)) return getRandomAuCostWithSeed(this.id).mul(player.a.costmult)
                return new OmegaNum("10{2}10")
            },
            costinc(){return getRandomAuCostIncWithSeed(this.id).pow(player.t.nerf.APU)},//??????omeganum???????????????
            unlocked(){return checkAroundUpg("a",this.id)},
            onPurchase(){
                player.a.milestones = AUMilestonekeep();
                player.a.points=new OmegaNum(0);
                player.points=new OmegaNum(0)
                for (let x = 2; x >= 0; x--) rowReset(x, "a")
                player.a.costmult=player.a.costmult.mul(layers[this.layer].upgrades[this.id].costinc())
            },
        },
    },
    buyables: {
        11: {
            cost(x) {
                var c = two.pow(x.add(40).pow(1.2)).root(3).sub(1)
                if(hasMilestone("a",18)) c = c.root(1.1)
                if(hasMilestone("a",19)) c = c.root(1.1)
                if(hasUpgrade("p",55)){
                c = c.pow(0.75)
                c = c.div(upgradeEffect("p",55))
                }
                if(hasMilestone("a",29)) c = c.div(layers.g.effect2())
                c = c.root(tokenEffect(33))
                return c
            },
            display() { return `????????????pp??????b???cmax.???????????????ap??????.<br />x${format(buyableEffect(this.layer,this.id),2)}.<br />??????:${format(this.cost(getBuyableAmount(this.layer, this.id)))}ap<br>??????:${formatWhole(getBuyableAmount(this.layer, this.id))}` },
            canAfford() { return player[this.layer].points.gte(this.cost().add(1)) },
            buy() {
                if(hasMilestone("t",7)){this.buyMax();return}
                if(!hasUpgrade("p",52)) player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            buyMax(){
                var basep = player.a.points
                basep = basep.pow(tokenEffect(33))
                if(hasMilestone("a",29)) basep = basep.mul(layers.g.effect2())
                if(hasUpgrade("p",55)){
                    basep = basep.mul(upgradeEffect("p",55))
                    basep = basep.root(0.75)
                }
                if(hasMilestone("a",18)) basep = basep.pow(1.1)
                if(hasMilestone("a",19)) basep = basep.pow(1.1)

                
                var c = basep.add(1).pow(3).logBase(2).root(1.2).sub(40).sub(getBuyableAmount(this.layer, this.id)).add(1).floor().max(0)
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(c))
            },
            effect(){
                var baseEff = player.a.ppbest.add(1).log10().div(200).add(1).pow(getBuyableAmount(this.layer,this.id).pow(0.33))
                baseEff = baseEff.mul(buyableEffect("a",12))
                if(hasMilestone("a",14)) baseEff = baseEff.pow(2)
                //if(baseEff.gt(2)) baseEff = baseEff.pow(0.75).mul(2**0.25)
                baseEff = powsoftcap(baseEff,e(1e15),hasMilestone("a",31)? 2:5)
                baseEff = logsoftcap(baseEff,e("e20"),0.5)
                if(this.unlocked()) return baseEff
                return new ExpantaNum(1)
            },
            unlocked(){return hasMilestone("a",14)&&geta().eq(1)},
            abtick:0,
            abdelay(){
                return hasMilestone("t",10) ? 0 : 1.797e308
            }
        },
        12: {
            cost(x) {
                var c = two.pow(x.add(35).pow(1.35)).root(4).sub(1)
                if(hasMilestone("a",18)) c = c.root(1.1)
                if(hasMilestone("a",19)) c = c.root(1.1)
                if(hasUpgrade("p",55)){
                    c = c.pow(0.75)
                    c = c.div(upgradeEffect("p",55))
                }
                if(hasMilestone("a",29)) c = c.div(layers.g.effect2())
                c = c.root(tokenEffect(33))
                return c
            },
            display() { return `??????ap??????cmax.????????????????????????ap??????????????????.<br />x${format(buyableEffect(this.layer,this.id),2)}.<br />??????:${format(this.cost(getBuyableAmount(this.layer, this.id)))}ap<br>??????:${formatWhole(getBuyableAmount(this.layer, this.id))}` },
            canAfford() { return player[this.layer].points.gte(this.cost().add(1)) },
            buy() {
                if(hasMilestone("t",7)){this.buyMax();return}
                if(!hasUpgrade("p",52)) player[this.layer].points = player[this.layer].points.sub(this.cost())
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1))
            },
            buyMax(){
                var basep = player.a.points
                basep = basep.pow(tokenEffect(33))
                if(hasMilestone("a",29)) basep = basep.mul(layers.g.effect2())
                if(hasUpgrade("p",55)){
                    basep = basep.mul(upgradeEffect("p",55))
                    basep = basep.root(0.75)
                }
                if(hasMilestone("a",18)) basep = basep.pow(1.1)
                if(hasMilestone("a",19)) basep = basep.pow(1.1)

                
                var c = basep.add(1).pow(4).logBase(2).root(1.35).sub(35).sub(getBuyableAmount(this.layer, this.id)).add(1).floor().max(0)
                setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(c))
            },
            effect(){
                var baseEff = player.a.points.add(1).log10().div(20).add(1).pow(getBuyableAmount(this.layer,this.id).pow(0.25))
                if(hasMilestone("a",14)) baseEff = baseEff.pow(2)
                //if(baseEff.gt(2)) baseEff = baseEff.pow(0.75).mul(2**0.25)
                baseEff = logsoftcap(baseEff,e("100"),0.5)
                if(this.unlocked()) return baseEff
                return new ExpantaNum(1)
            },
            unlocked(){return hasMilestone("a",14)&&geta().eq(1)},
            abtick:0,
            abdelay(){
                return hasMilestone("t",10) ? 0 : 1.797e308
            }
        },
    },

    challenges: {
        11: {
            name: "????????????",
            challengeDescription: "????????????^0.33.?????????^1.5,???????????????^3.??????????????????.",
            canComplete(){return player.points.gte("e290000")},
            goalDescription(){return format(ExpantaNum("e290000"))+"??????"},
            rewardDisplay(){return `??????????????????????????????.`},
            unlocked(){return hasMilestone("a",24)},
            onEnter(){doACreset()},
            onExit(){player.a.activeChallenge = 11}
        },
        12: {
            name: "????????????",
            challengeDescription: "??????10?????????????????????,?????????xlog10(x+10)???????????????rau??????(???x1000???????????????).????????????^0.5.?????????????????????????????????????????????.????????????????????????.",
            canComplete(){return player.points.gte("e118000")},
            goalDescription(){return format(ExpantaNum("e118000"))+"??????"},
            rewardDisplay(){return `??????????????????????????????.`},
            unlocked(){return hasMilestone("a",26)},
            onEnter(){doACreset()},
            onExit(){player.a.activeChallenge = 12}
        },
        21: {
            name: "????????????",
            challengeDescription: "????????????.????????????????????????.??????????????????.????????????^0.25.p11??????/1000.",
            canComplete(){return player.t.currentC == 13 && player.points.gte("e2e7")},
            goalDescription(){return "???tc13?????????e2e7??????"},
            rewardDisplay(){return `??????????????????????????????.`},
            unlocked(){return hasMilestone("a",33)},
            onEnter(){doACreset()},
            onExit(){player.a.activeChallenge = 21}
        },
        22: {
            name: "????????????",
            challengeDescription: "?????????????????????ap?????????????????????????????????????????????????????????????????????ap??????.??????p????????????????????????1.",
            canComplete(){return hasUpgrade("a",81) || hasUpgrade("a",82) ||hasUpgrade("a",83) ||hasUpgrade("a",84) ||hasUpgrade("a",85)},
            goalDescription(){return "???????????????au"},
            rewardDisplay(){return `??????????????????????????????.`},
            unlocked(){return hasMilestone("a",34)},
            onEnter(){doACreset()},
            onExit(){player.a.activeChallenge = 22}
        },
    },

    //important!!!
    update(diff){    
        //player.a.limitBest = player.a.limitBest.max(getAPlimit())
        //player.a.best = player.a.limitBest.min(player.a.best)
        player.a.points = player.a.points.min(getAPlimit().floor())
        player.a.pointbest = player.points.max(player.a.pointbest)
        player.a.ppbest = player.p.points.max(player.a.ppbest)
        if(hasMilestone("a",24)) player.a.points = player.a.points.max(3)
        if(hasMilestone("t",6)) player.a.resetU = player.a.resetU.add(getResetUGain().mul(diff*0.01))
        player.a.points = player.a.points.add(this.getResetGain().mul(Math.min(diff*this.getPassiveGeneration(),1)))

        //auto
        for(i in player[this.layer].buyables){
            if(layers[this.layer].buyables[i]){
                layers[this.layer].buyables[i].abtick += diff
                if(layers[this.layer].buyables[i].abtick >= layers[this.layer].buyables[i].abdelay() && layers[this.layer].buyables[i].unlocked()){
                    layers[this.layer].buyables[i].buy()
                    layers[this.layer].buyables[i].abtick = 0
                }
            }
        }
    },
    milestones: {
        0: {
            requirementDescription: "1:3ap",
            effectDescription: "????????????+.????????????p?????????.pp??????c???????????????/2,??????p11??????,??????????????????????????????e10?????????????????????(^0.125->0.1875),????????????x5,ap???p?????????x10",
            done() { return player.a.points.gte(3) }
        },
        1: {
            requirementDescription: "2:4ap",
            effectDescription: "??????ap???P?????????.Tip:??????????????????????????????ap!",
            done() { return player.a.points.gte(4) },
            unlocked(){return hasMilestone("a",0)},
        },
        2: {
            requirementDescription: "3:5ap",
            effectDescription: "??????a?????????1.????????????10%???pp.",
            done() { return player.a.points.gte(5) },
            unlocked(){return hasMilestone("a",1)},
        },
        3: {
            requirementDescription: "4:10ap",
            effectDescription: "?????????????????????.ap???P??????????????????????????????p?????????.",
            done() { return player.a.points.gte(10) },
            unlocked(){return hasMilestone("a",2)},
        },
        4: {
            requirementDescription: "5:20ap",
            effectDescription: "??????p??????.",
            done() { return player.a.points.gte(20) },
            unlocked(){return hasMilestone("a",3)},
        },
        5: {
            requirementDescription: "6:25ap",
            effectDescription: "????????????100%???pp,?????????10%.",
            done() { return player.a.points.gte(25) },
            unlocked(){return hasMilestone("a",4)},
        },
        6: {
            requirementDescription: "7:40ap",
            effectDescription: "???????????????????????????x3.14.",
            done() { return player.a.points.gte(40) },
            unlocked(){return hasMilestone("a",5)},
        },
        7: {
            requirementDescription: "8:50ap",
            effectDescription: "??????ap??????(au).??????ap?????????50.??????ap?????????????????????a???,??????????????????ap,????????????????????????.?????????1???8??????????????????????????????.???????????????????????????6.ap??????????????????ap.<br>???:??????????????????ap??????,??????ap???????????????????????????.???????????????????????????????????????????????????????????????????????????.",
            done() { return player.a.points.gte(50) },
            unlocked(){return hasMilestone("a",6)||hasMilestone("a",7)},
        },
        8: {
            requirementDescription: "9:2au",
            effectDescription: "ap????????????au??????.( = 50^((au/5)^2+1) )",
            done() { return player.a.upgrades.length >= 2 },
            unlocked(){return hasMilestone("a",7)},
        },
        9: {
            requirementDescription: "10:5au",
            effectDescription: "ap????????????????????????.",
            done() { return player.a.upgrades.length >= 5 },
            unlocked(){return hasMilestone("a",8)},
        },
        10: {
            requirementDescription: "11:5000ap",
            effectDescription: "e500????????????????????????.",
            done() { return player.a.points.gte(5000) },
            unlocked(){return hasMilestone("a",7)},
        },
        11: {
            requirementDescription: "12:??????????????????????????????25",
            effectDescription: "???????????????.",
            done() { return player.a.costmult.gte(25) },
            unlocked(){return hasMilestone("a",9)},
        },
        12: {
            requirementDescription: "13:10000ap",
            effectDescription: "???????????????????????????x10.",
            done() { return player.a.points.gte(10000) },
            unlocked(){return hasMilestone("a",10)},
        },
        13: {
            requirementDescription: "14:10au",
            effectDescription: "????????????au??????ap??????.?????????????????????au24????????????.(?????????????????????au24).?????????????????????ap??????.???????????????????????????^2.(????????????)",
            done() { return player.a.upgrades.length >= 10 },
            unlocked(){return hasMilestone("a",11)},
        },
        14: {
            requirementDescription: "15:2.5e9ap",
            effectDescription: "????????????ap????????????.?????????????????????1.",
            done() { return player.a.points.gte(2.5e9) },
            unlocked(){return hasMilestone("a",12)},
        },
        15: {
            requirementDescription: "16:????????????11??????6???",
            effectDescription: "ap?????????????????????^2.??????p14???e100?????????.(^0.25->^0.5)",
            done() { return player.a.buyables[11].gte(6) },
            unlocked(){return hasMilestone("a",13)},
        },
        16: {
            requirementDescription: "17:????????????35",
            effectDescription: "???????????????????????????????????????????????????????????????????????????.(*(x-1)^0.25)",
            done() { return hasUpgrade("a",35) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        17: {
            requirementDescription: "18:????????????35???????????????256 000 000ap",
            effectDescription: "?????????e4000???????????????.(^0.2 -> ^0.25).ap????????????11??????p34.",
            done() { return hasUpgrade("a",35)&&player.a.points.gte(256000000) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        18: {
            requirementDescription: "19:????????????35???????????????512 000 000ap",
            effectDescription: "ap????????????????????????????????????1.1??????.",
            done() { return hasUpgrade("a",35)&&player.a.points.gte(512000000) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        19: {
            requirementDescription: "20:????????????35???????????????e12800P.",
            effectDescription: "ap????????????????????????????????????1.1??????.",
            done() { return hasUpgrade("a",35)&&player.points.gte("e12000") },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        20: {
            requirementDescription: "21:e39000P.",
            effectDescription: "???????????????10%???ap.???????????????^2.",
            done() { return player.points.gte("e39000") },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        21: {
            requirementDescription: "22:7.5e10AP + e68,000P.",
            effectDescription: "???????????????100%???ap.??????????????????????????????????????????????????????ap???????????????.(*log10(x+10)^0.5)",
            done() { return player.points.gte("e68000")&&player.a.points.gte(7.5e10) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        22: {
            requirementDescription: "23:15au.",
            effectDescription: "???????????????1000%???ap.?????????????????????(??????d^).???????????????????????????d^.",
            done() { return player.a.upgrades.length >= 15 },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        23: {
            requirementDescription: "24:e100,000P.",
            effectDescription: "ap??????????????????12??????p??????????????????11.(???????????????)???????????????.",
            done() { return player.points.gte("e100000") },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        24: {
            requirementDescription: "25:e900,000?????????+6?????????.",
            effectDescription: "??????????????????????????????????ap??????(ac) ?????????????????????????????????????????????,???????????????ap???1,8,25?????????.??????ap???????????????3.??????au35??????????????????ap.",
            done() { return player.i.points.gte("e900000") && player.g.points.gte(6) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        25: {
            requirementDescription: "26:30?????????.&&e1 000 000P",
            effectDescription: "p??????????????????21?????????^0.5?????????p45.",
            done() { return player.i.points.gte("e1000000") && player.g.points.gte(30) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        26: {
            requirementDescription: "27:100?????????.",
            effectDescription: "?????????.p???????????????100%.????????????????????????.",
            done() { return player.g.points.gte(100) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        27: {
            requirementDescription: "28:150?????????",
            effectDescription: "????????????10000%????????????.???????????????^1.25.",
            done() { return player.g.points.gte(150) }
        },
        28: {
            requirementDescription: "29:225?????????",
            effectDescription: "????????????b/g???ts???log????????????.?????????????????????log????????????.(0.5???log -> 0.175???log)",
            done() { return player.g.points.gte(225) }
        },
        29: {
            requirementDescription: "30:250?????????",
            effectDescription: "??????????????????ap????????????????????????.(/(x+1)^0.33)??????ap?????????log????????????.",
            done() { return player.g.points.gte(250) }
        },
        30: {
            requirementDescription: "31:280?????????",
            effectDescription: "p55??????^1.5.",
            done() { return player.g.points.gte(280) }
        },
        31: {
            requirementDescription: "32:420?????????",
            effectDescription: "ap??????????????????11???????????????????????????.",
            done() { return player.g.points.gte(420) }
        },
        32: {
            requirementDescription: "33:1460?????????",
            effectDescription: "?????????????????????????????????.",
            done() { return player.g.points.gte(1460) }
        },
        33: {
            requirementDescription: "34:1550?????????.",
            effectDescription: "?????????.????????????au,????????????10%???ap.????????????????????????.",
            done() { return player.g.points.gte(1550) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        34: {
            requirementDescription: "35:e2e9??????.",
            effectDescription: "?????????.??????B???G??????????????????.au35?????????????????????.ap?????????9???????????????5.????????????????????????.",
            done() { return player.points.gte("e2e9") },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
        35: {
            requirementDescription: "36:15000?????????.",
            effectDescription: "???????????????15000???,????????????????????? 15000*((x/15000)^4)^^1.2.",
            done() { return player.g.points.gte(15000) },
            unlocked(){return hasMilestone(this.layer,this.id-1)||hasMilestone(this.layer,this.id) },
        },
    },
    getPassiveGeneration(){
        if(hasMilestone("a",22) || hasMilestone("t",17)) return 10
        if(hasMilestone("a",21)) return 1
        if(hasMilestone("a",20) || (hasMilestone("a",33) && player.a.upgrades.length > 0)) return 0.1
        return 0
    },
    getResetGain(){
        var gain = new ExpantaNum(1)
        gain = gain.mul(this.baseAmount().div(this.requires()).pow(this.exponent)).pow(this.gainExp()).mul(this.gainMult())
        gain = gain.root(player.t.nerf.AP)
        //if(gain.gte(5)) gain = gain.pow(0.75).mul(5**0.25)
        if(gain.gte(100000)) gain = gain.cbrt().mul(100000**0.66666666666)
        gain = logsoftcap(gain,e(1e33),0.75)

        //after softcap - token milestone 17 effect
        if(hasMilestone("t",16)) if(hasUpgrade("p",51)) gain = gain.mul(upgradeEffect("p",51).sqrt())

        if(player.a.points.add(gain).gt(getAPlimit())) return getAPlimit().sub(player.a.points).max(0)
        return gain.floor()
    },
    prestigeButtonText(){
        return "+ "+formatWhole(this.getResetGain())+" "+this.resource
    },
    hotkeys: [
        {key: "a", description: "A: a???", onPress(){if (canReset(this.layer)) doReset(this.layer)}},
    ],
    tabFormat: {
        AP?????????: {
            buttonStyle() {return  {'color': 'lightblue'}},
            content:
                ["main-display",
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.buffp)+" / "+HARDformat(player.v.points)
                //    if(player.v.buffp.gt(player.v.points)) basestr+=` <warning style="color:red";>(WARNING:?????????????????????!)</warning>`
                //    return basestr
                //}],
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.nerfp)+" / "+HARDformat(player.v.points)
                //    if(player.v.nerfp.lt(player.v.points)) basestr+=` <warning style="color:red">(WARNING:????????????????????????!??????????????????!)</warning>`
                //   return basestr
                //}],
                "prestige-button", "resource-display",
                "milestones",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //["blank", "5px"],
                //"buyables",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //"upgrades",
                ],},
        AP?????????: {
            buttonStyle() {return  {'color': 'lightblue'}},
            unlocked() {return hasMilestone("a",7)},
            content:
                ["main-display",
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.buffp)+" / "+HARDformat(player.v.points)
                //    if(player.v.buffp.gt(player.v.points)) basestr+=` <warning style="color:red";>(WARNING:?????????????????????!)</warning>`
                //    return basestr
                //}],
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.nerfp)+" / "+HARDformat(player.v.points)
                //    if(player.v.nerfp.lt(player.v.points)) basestr+=` <warning style="color:red">(WARNING:????????????????????????!??????????????????!)</warning>`
                //   return basestr
                //}],
                "clickables",// "resource-display",
                "upgrades",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //["blank", "5px"],
                //"buyables",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //"upgrades",
                ],},
        AP?????????: {
            buttonStyle() {return  {'color': 'lightblue'}},
            unlocked() {return hasMilestone("a",14)},
            content:
                ["main-display",
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.buffp)+" / "+HARDformat(player.v.points)
                //    if(player.v.buffp.gt(player.v.points)) basestr+=` <warning style="color:red";>(WARNING:?????????????????????!)</warning>`
                //    return basestr
                //}],
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.nerfp)+" / "+HARDformat(player.v.points)
                //    if(player.v.nerfp.lt(player.v.points)) basestr+=` <warning style="color:red">(WARNING:????????????????????????!??????????????????!)</warning>`
                //   return basestr
                //}],
                //"clickables",// "resource-display",
                "buyables",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //["blank", "5px"],
                //"buyables",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //"upgrades",
                ],},
        AP?????????: {
            buttonStyle() {return  {'color': 'lightblue'}},
            unlocked() {return hasMilestone("a",24)},
            content:
                ["main-display",
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.buffp)+" / "+HARDformat(player.v.points)
                //    if(player.v.buffp.gt(player.v.points)) basestr+=` <warning style="color:red";>(WARNING:?????????????????????!)</warning>`
                //    return basestr
                //}],
                //["display-text", function() {
                //    var basestr = "?????????????????? "+HARDformat(player.v.nerfp)+" / "+HARDformat(player.v.points)
                //    if(player.v.nerfp.lt(player.v.points)) basestr+=` <warning style="color:red">(WARNING:????????????????????????!??????????????????!)</warning>`
                //   return basestr
                //}],
                //"clickables",// "resource-display",
                "challenges",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //["blank", "5px"],
                //"buyables",
                //["blank", "5px"], // Height
                //"h-line",
                //["display-text", function() {return "????????????"}],
                //"upgrades",
                ],},
    },
})
