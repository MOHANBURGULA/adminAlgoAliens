import 'dotenv/config'
import { DataSource } from 'typeorm'
import { createDataSourceOptions } from './typeorm.config'

const dataSource = new DataSource(createDataSourceOptions())

export default dataSource
