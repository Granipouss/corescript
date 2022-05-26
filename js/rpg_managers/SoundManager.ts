import { AudioManager } from './AudioManager';

/**
 * The static class that plays sound effects defined in the database.
 */
export const SoundManager = new (class SoundManager {
    preloadImportantSounds(): void {
        this.loadSystemSound(0);
        this.loadSystemSound(1);
        this.loadSystemSound(2);
        this.loadSystemSound(3);
    }

    loadSystemSound(n: number): void {
        if (window.$dataSystem) {
            AudioManager.loadStaticSe(window.$dataSystem.sounds[n]);
        }
    }

    playSystemSound(n: number): void {
        if (window.$dataSystem) {
            AudioManager.playStaticSe(window.$dataSystem.sounds[n]);
        }
    }

    playCursor(): void {
        this.playSystemSound(0);
    }

    playOk(): void {
        this.playSystemSound(1);
    }

    playCancel(): void {
        this.playSystemSound(2);
    }

    playBuzzer(): void {
        this.playSystemSound(3);
    }

    playEquip(): void {
        this.playSystemSound(4);
    }

    playSave(): void {
        this.playSystemSound(5);
    }

    playLoad(): void {
        this.playSystemSound(6);
    }

    playBattleStart(): void {
        this.playSystemSound(7);
    }

    playEscape(): void {
        this.playSystemSound(8);
    }

    playEnemyAttack(): void {
        this.playSystemSound(9);
    }

    playEnemyDamage(): void {
        this.playSystemSound(10);
    }

    playEnemyCollapse(): void {
        this.playSystemSound(11);
    }

    playBossCollapse1(): void {
        this.playSystemSound(12);
    }

    playBossCollapse2(): void {
        this.playSystemSound(13);
    }

    playActorDamage(): void {
        this.playSystemSound(14);
    }

    playActorCollapse(): void {
        this.playSystemSound(15);
    }

    playRecovery(): void {
        this.playSystemSound(16);
    }

    playMiss(): void {
        this.playSystemSound(17);
    }

    playEvasion(): void {
        this.playSystemSound(18);
    }

    playMagicEvasion(): void {
        this.playSystemSound(19);
    }

    playReflection(): void {
        this.playSystemSound(20);
    }

    playShop(): void {
        this.playSystemSound(21);
    }

    playUseItem(): void {
        this.playSystemSound(22);
    }

    playUseSkill(): void {
        this.playSystemSound(23);
    }
})();
