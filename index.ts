import { IndeedJobsScraper } from './nodes/IndeedJobsScraper/IndeedJobsScraper.node';
import { ApifyApi } from './credentials/ApifyApi.credentials';

export const nodeTypes = [IndeedJobsScraper];

export const credentialTypes = [ApifyApi];
