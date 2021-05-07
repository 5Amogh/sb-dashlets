import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { DataService } from '../../services';
import { IReportType, InputParams, IBigNumberConfig, IBigNumber, ChartType, UpdateInputParams, StringObject } from '../../types';
import { BaseComponent } from '../base/base.component';
import { DEFAULT_CONFIG as DEFAULT_CONFIG_TOKEN, DASHLET_CONSTANTS } from '../../tokens';
import { runAggregator } from './operations';
@Component({
  selector: 'sb-big-number',
  templateUrl: './big-number.component.html',
  styleUrls: ['./big-number.component.css'],
  providers: [
    {
      provide: DEFAULT_CONFIG_TOKEN,
      useValue: {
        header: '',
        footer: '',
        operation: 'SUM'
      }
    }
  ]
})
export class BigNumberComponent extends BaseComponent implements IBigNumber {

  config: any;
  reportType: IReportType = IReportType.CHART;
  type: ChartType = ChartType.BIG_NUMBER;
  _defaultConfig: IBigNumberConfig;

  chart: IBigNumberConfig = {};

  private _bigNumberClosure: any;

  constructor(protected dataService: DataService, @Inject(DEFAULT_CONFIG_TOKEN) defaultConfig: IBigNumberConfig, private cdr: ChangeDetectorRef, @Inject(DASHLET_CONSTANTS) private CONSTANTS: StringObject) {
    super(dataService);
    this._defaultConfig = defaultConfig;
  }

  async initialize({ config, data, type = "bigNumber" }: InputParams): Promise<any> {
    if (!(config && data)) throw new SyntaxError(this.CONSTANTS.INVALID_INPUT);
    this.config = config = { ...config, type };
    const fetchedJSON = this.data = await this.fetchData(data).toPromise().catch(err => []);
    this.chartBuilder(config as IBigNumberConfig, fetchedJSON);
    this._isInitialized = true;
  }

  chartBuilder(config: IBigNumberConfig, JSONData) {
    const { header = this._defaultConfig.header, footer = this._defaultConfig.footer, dataExpr, operation = this._defaultConfig.operation } = config;
    if (!dataExpr || !JSONData) {
      throw Error(this.CONSTANTS.INVALID_INPUT);
    }
    this._bigNumberClosure = this.bigNumberDataClosure(dataExpr)(operation)(JSONData);
    const bigNumberObj = { header, footer, data: this._bigNumberClosure.getData() }
    this.setBigNumberData(bigNumberObj);
  }

  private setBigNumberData(config: object = {}) {
    this.chart = { ...this._defaultConfig, ...this.chart, ...config };
    this.cdr.detectChanges();
  }

  private bigNumberDataClosure = (dataExpr: string) => $aggregateFn => (data: object[]) => {
    return {
      getData(overriddenData?: object[]) {
        data = overriddenData || data;
        return runAggregator($aggregateFn, data, dataExpr);
      },
      addData(newData: object[]) {
        data = data.concat(newData);
        return this.getData();
      }
    }
  }

  reset(): void {
    throw new Error(this.CONSTANTS.METHOD_NOT_IMPLEMENTED);
  }

  destroy(): void {
    throw new Error(this.CONSTANTS.METHOD_NOT_IMPLEMENTED);
  }

  update(input: Partial<Omit<UpdateInputParams, "type">>) {
    this.checkIfInitialized();
    if (!input) throw new Error(this.CONSTANTS.INVALID_INPUT);
    const { config = {}, data = null } = input;
    const { header, footer, dataExpr, operation = 'SUM' } = config as IBigNumberConfig;
    let bigNumber;
    if (data) {
      this._bigNumberClosure = (dataExpr && this.bigNumberDataClosure(dataExpr)(operation)(data)) || this._bigNumberClosure;
      bigNumber = this._bigNumberClosure.getData(data);
    }
    this.setBigNumberData({
      ...(header && { header }),
      ...(footer && { footer }),
      ...(bigNumber && {
        data: bigNumber
      })
    })
  }

  addData(data: object | object[]) {
    if (!data) throw new Error(this.CONSTANTS.INVALID_INPUT);
    data = Array.isArray(data) ? data : [data];
    const bigNumber = this._bigNumberClosure.addData(data);
    this.setBigNumberData({
      data: bigNumber
    });
  }

  refreshChart() {
    throw new Error(this.CONSTANTS.METHOD_NOT_IMPLEMENTED);
  }

  getTelemetry() {
    throw new Error(this.CONSTANTS.METHOD_NOT_IMPLEMENTED);
  }
}
