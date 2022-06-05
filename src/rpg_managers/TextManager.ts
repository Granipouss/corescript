/**
 * The static class that handles terms and messages.
 */
export const TextManager = new (class TextManager {
    basic(basicId: number): string {
        return window.$dataSystem.terms.basic[basicId] || '';
    }

    param(paramId: number): string {
        return window.$dataSystem.terms.params[paramId] || '';
    }

    command(commandId: number): string {
        return window.$dataSystem.terms.commands[commandId] || '';
    }

    message(messageId: string): string {
        return window.$dataSystem.terms.messages[messageId] || '';
    }

    get currencyUnit(): string {
        return window.$dataSystem.currencyUnit;
    }

    //#region Basic

    get level(): string {
        return this.basic(0);
    }
    get levelA(): string {
        return this.basic(1);
    }
    get hp(): string {
        return this.basic(2);
    }
    get hpA(): string {
        return this.basic(3);
    }
    get mp(): string {
        return this.basic(4);
    }
    get mpA(): string {
        return this.basic(5);
    }
    get tp(): string {
        return this.basic(6);
    }
    get tpA(): string {
        return this.basic(7);
    }
    get exp(): string {
        return this.basic(8);
    }
    get expA(): string {
        return this.basic(9);
    }

    //#endregion

    //#region Command

    get fight(): string {
        return this.command(0);
    }
    get escape(): string {
        return this.command(1);
    }
    get attack(): string {
        return this.command(2);
    }
    get guard(): string {
        return this.command(3);
    }
    get item(): string {
        return this.command(4);
    }
    get skill(): string {
        return this.command(5);
    }
    get equip(): string {
        return this.command(6);
    }
    get status(): string {
        return this.command(7);
    }
    get formation(): string {
        return this.command(8);
    }
    get save(): string {
        return this.command(9);
    }
    get gameEnd(): string {
        return this.command(10);
    }
    get options(): string {
        return this.command(11);
    }
    get weapon(): string {
        return this.command(12);
    }
    get armor(): string {
        return this.command(13);
    }
    get keyItem(): string {
        return this.command(14);
    }
    get equip2(): string {
        return this.command(15);
    }
    get optimize(): string {
        return this.command(16);
    }
    get clear(): string {
        return this.command(17);
    }
    get newGame(): string {
        return this.command(18);
    }
    get continue_(): string {
        return this.command(19);
    }
    get toTitle(): string {
        return this.command(21);
    }
    get cancel(): string {
        return this.command(22);
    }
    get buy(): string {
        return this.command(24);
    }
    get sell(): string {
        return this.command(25);
    }

    //#endregion

    //#region Message

    get alwaysDash(): string {
        return this.message('alwaysDash');
    }
    get commandRemember(): string {
        return this.message('commandRemember');
    }
    get bgmVolume(): string {
        return this.message('bgmVolume');
    }
    get bgsVolume(): string {
        return this.message('bgsVolume');
    }
    get meVolume(): string {
        return this.message('meVolume');
    }
    get seVolume(): string {
        return this.message('seVolume');
    }
    get possession(): string {
        return this.message('possession');
    }
    get expTotal(): string {
        return this.message('expTotal');
    }
    get expNext(): string {
        return this.message('expNext');
    }
    get saveMessage(): string {
        return this.message('saveMessage');
    }
    get loadMessage(): string {
        return this.message('loadMessage');
    }
    get file(): string {
        return this.message('file');
    }
    get partyName(): string {
        return this.message('partyName');
    }
    get emerge(): string {
        return this.message('emerge');
    }
    get preemptive(): string {
        return this.message('preemptive');
    }
    get surprise(): string {
        return this.message('surprise');
    }
    get escapeStart(): string {
        return this.message('escapeStart');
    }
    get escapeFailure(): string {
        return this.message('escapeFailure');
    }
    get victory(): string {
        return this.message('victory');
    }
    get defeat(): string {
        return this.message('defeat');
    }
    get obtainExp(): string {
        return this.message('obtainExp');
    }
    get obtainGold(): string {
        return this.message('obtainGold');
    }
    get obtainItem(): string {
        return this.message('obtainItem');
    }
    get levelUp(): string {
        return this.message('levelUp');
    }
    get obtainSkill(): string {
        return this.message('obtainSkill');
    }
    get useItem(): string {
        return this.message('useItem');
    }
    get criticalToEnemy(): string {
        return this.message('criticalToEnemy');
    }
    get criticalToActor(): string {
        return this.message('criticalToActor');
    }
    get actorDamage(): string {
        return this.message('actorDamage');
    }
    get actorRecovery(): string {
        return this.message('actorRecovery');
    }
    get actorGain(): string {
        return this.message('actorGain');
    }
    get actorLoss(): string {
        return this.message('actorLoss');
    }
    get actorDrain(): string {
        return this.message('actorDrain');
    }
    get actorNoDamage(): string {
        return this.message('actorNoDamage');
    }
    get actorNoHit(): string {
        return this.message('actorNoHit');
    }
    get enemyDamage(): string {
        return this.message('enemyDamage');
    }
    get enemyRecovery(): string {
        return this.message('enemyRecovery');
    }
    get enemyGain(): string {
        return this.message('enemyGain');
    }
    get enemyLoss(): string {
        return this.message('enemyLoss');
    }
    get enemyDrain(): string {
        return this.message('enemyDrain');
    }
    get enemyNoDamage(): string {
        return this.message('enemyNoDamage');
    }
    get enemyNoHit(): string {
        return this.message('enemyNoHit');
    }
    get evasion(): string {
        return this.message('evasion');
    }
    get magicEvasion(): string {
        return this.message('magicEvasion');
    }
    get magicReflection(): string {
        return this.message('magicReflection');
    }
    get counterAttack(): string {
        return this.message('counterAttack');
    }
    get substitute(): string {
        return this.message('substitute');
    }
    get buffAdd(): string {
        return this.message('buffAdd');
    }
    get debuffAdd(): string {
        return this.message('debuffAdd');
    }
    get buffRemove(): string {
        return this.message('buffRemove');
    }
    get actionFailure(): string {
        return this.message('actionFailure');
    }

    //#endregion
})();
