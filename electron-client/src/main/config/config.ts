import Store from 'electron-store';

export interface AppConfig {
    domain: string;
    apiKey: string;
    project: string;
    interval: number;
    debug: boolean;
}

const defaultConfig: AppConfig = {
    domain: 'https://notify.try-8verything.com',
    apiKey: '',
    project: '',
    interval: 5,
    debug: false,
};

export class ConfigManager {
    private store: Store<AppConfig>;

    constructor() {
        this.store = new Store<AppConfig>({
            name: 'config',
            defaults: defaultConfig,
            schema: {
                domain: {
                    type: 'string',
                    default: 'https://notify.try-8verything.com',
                },
                apiKey: {
                    type: 'string',
                    default: '',
                },
                project: {
                    type: 'string',
                    default: '',
                },
                interval: {
                    type: 'number',
                    minimum: 1,
                    maximum: 3600,
                    default: 5,
                },
                debug: {
                    type: 'boolean',
                    default: false,
                },
            },
        });
    }

    getConfig(): AppConfig {
        return {
            domain: this.store.get('domain'),
            apiKey: this.store.get('apiKey'),
            project: this.store.get('project'),
            interval: this.store.get('interval'),
            debug: this.store.get('debug'),
        };
    }

    saveConfig(config: Partial<AppConfig>): void {
        if (config.domain !== undefined) {
            this.store.set('domain', config.domain);
        }
        if (config.apiKey !== undefined) {
            this.store.set('apiKey', config.apiKey);
        }
        if (config.project !== undefined) {
            this.store.set('project', config.project);
        }
        if (config.interval !== undefined) {
            this.store.set('interval', config.interval);
        }
        if (config.debug !== undefined) {
            this.store.set('debug', config.debug);
        }
    }

    resetConfig(): void {
        this.store.clear();
    }
}
