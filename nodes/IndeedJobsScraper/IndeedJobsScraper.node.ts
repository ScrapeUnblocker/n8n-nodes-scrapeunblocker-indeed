import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import type { OptionField } from './GenericFunctions';
import { applyOptions, requireString, runActorAndGetItems } from './GenericFunctions';

// ScrapeUnblocker's public "Indeed Jobs Scraper" Actor: https://apify.com/scrapeunblocker/indeed-scraper
const ACTOR_ID = 'lBOpcpl7RNppJYRCj';
const INTEGRATION_APP_ID = 'scrapeunblocker-indeed-scraper';

// Node option name -> Actor input key.
const OPTION_FIELDS: Record<string, OptionField> = {
	country: {
		key: 'country',
	},
	location: {
		key: 'location',
	},
	radius: {
		key: 'radius',
	},
	jobType: {
		key: 'job_type',
	},
	days: {
		key: 'days',
	},
	remote: {
		key: 'remote',
	},
	sort: {
		key: 'sort',
	},
	proxyCountry: {
		key: 'proxy_country',
		kind: 'upper',
	},
};

function buildActorInput(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	options: IDataObject,
	itemIndex: number,
): IDataObject {
	const input: IDataObject = {};

	switch (`${resource}:${operation}`) {
		case 'job:search': {
			input.query = requireString.call(this, 'query', 'Search Query', itemIndex);
			input.max_results = this.getNodeParameter('maxResults', itemIndex);
			break;
		}
		default:
			throw new NodeOperationError(
				this.getNode(),
				`The operation "${operation}" is not supported for resource "${resource}"`,
				{ itemIndex },
			);
	}

	applyOptions(input, options, OPTION_FIELDS);
	return input;
}

export class IndeedJobsScraper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Indeed Jobs Scraper',
		name: 'indeedJobsScraper',
		icon: {
			light: 'file:indeedJobsScraper.png',
			dark: 'file:indeedJobsScraper.dark.png',
		},
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Search Indeed job listings on 20 country sites with the ScrapeUnblocker Actor on Apify',
		defaults: {
			name: 'Indeed Jobs Scraper',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'apifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Job',
						value: 'job',
					},
				],
				default: 'job',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['job'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search Indeed jobs by keyword',
						action: 'Search jobs',
					},
				],
				default: 'search',
			},
			{
				displayName: 'Search Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'software engineer',
				description: "What to search for, e.g. 'software engineer' or 'nurse'",
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Max Results',
				name: 'maxResults',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				default: 60,
				description: 'How many jobs to collect across pages (1-500)',
				displayOptions: {
					show: {
						resource: ['job'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Country Site',
						name: 'country',
						type: 'options',
						options: [
							{
								name: 'Australia',
								value: 'au',
							},
							{
								name: 'Austria',
								value: 'at',
							},
							{
								name: 'Belgium',
								value: 'be',
							},
							{
								name: 'Canada',
								value: 'ca',
							},
							{
								name: 'France',
								value: 'fr',
							},
							{
								name: 'Germany',
								value: 'de',
							},
							{
								name: 'India',
								value: 'in',
							},
							{
								name: 'Ireland',
								value: 'ie',
							},
							{
								name: 'Italy',
								value: 'it',
							},
							{
								name: 'Mexico',
								value: 'mx',
							},
							{
								name: 'Netherlands',
								value: 'nl',
							},
							{
								name: 'New Zealand',
								value: 'nz',
							},
							{
								name: 'Poland',
								value: 'pl',
							},
							{
								name: 'Singapore',
								value: 'sg',
							},
							{
								name: 'South Africa',
								value: 'za',
							},
							{
								name: 'Spain',
								value: 'es',
							},
							{
								name: 'Sweden',
								value: 'se',
							},
							{
								name: 'Switzerland',
								value: 'ch',
							},
							{
								name: 'United Kingdom',
								value: 'uk',
							},
							{
								name: 'United States',
								value: 'us',
							},
						],
						default: 'us',
						description: "Which country's Indeed site to search",
					},
					{
						displayName: 'Job Type',
						name: 'jobType',
						type: 'options',
						options: [
							{
								name: 'Any',
								value: '',
							},
							{
								name: 'Contract',
								value: 'contract',
							},
							{
								name: 'Full Time',
								value: 'fulltime',
							},
							{
								name: 'Internship',
								value: 'internship',
							},
							{
								name: 'Part Time',
								value: 'parttime',
							},
							{
								name: 'Temporary',
								value: 'temporary',
							},
						],
						default: '',
						description: 'Only jobs of this employment type',
					},
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: '',
						placeholder: 'Austin, TX',
						description:
							"Where to search, e.g. 'Austin, TX' or 'London'. Leave blank for the whole country.",
					},
					{
						displayName: 'Posted Within',
						name: 'days',
						type: 'options',
						options: [
							{
								name: 'Any Time',
								value: '',
							},
							{
								name: 'Last 1 Day',
								value: '1',
							},
							{
								name: 'Last 14 Days',
								value: '14',
							},
							{
								name: 'Last 3 Days',
								value: '3',
							},
							{
								name: 'Last 7 Days',
								value: '7',
							},
						],
						default: '',
						description: 'Only jobs posted within this time window',
					},
					{
						displayName: 'Proxy Country',
						name: 'proxyCountry',
						type: 'string',
						default: '',
						placeholder: 'US',
						description:
							'Exit-IP country (ISO-2, e.g. GB). Defaults to the country of the selected site.',
					},
					{
						displayName: 'Radius',
						name: 'radius',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 25,
						description:
							'Search radius around the location, in miles or kilometres depending on the country site. 0 searches the exact location only.',
					},
					{
						displayName: 'Remote Only',
						name: 'remote',
						type: 'boolean',
						default: false,
						description: 'Whether to return only remote jobs',
					},
					{
						displayName: 'Sort By',
						name: 'sort',
						type: 'options',
						options: [
							{
								name: 'Date',
								value: 'date',
							},
							{
								name: 'Relevance',
								value: 'relevance',
							},
						],
						default: 'relevance',
						description: 'Order the results by relevance or by date',
					},
					{
						displayName: 'Timeout (Seconds)',
						name: 'timeout',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'Maximum run time of the Apify Actor run. 0 keeps the Actor default. A run that times out fails the node.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const options = this.getNodeParameter('options', i, {}) as IDataObject;
				const { timeout, ...actorOptions } = options;

				const input = buildActorInput.call(this, resource, operation, actorOptions, i);
				const { items: results } = await runActorAndGetItems.call(this, {
					actorId: ACTOR_ID,
					integrationAppId: INTEGRATION_APP_ID,
					input,
					itemIndex: i,
					timeoutSecs: (timeout as number) || undefined,
				});

				for (const result of results) {
					returnData.push({ json: result, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				// Both constructors return an error of their own class unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
