// How the datasource step sources outcome data: an existing datasource, a newly
// created one, or (MAB only) no data warehouse at all. Lives in its own module so
// type-only consumers (form defs, experiment-form-types) can share it without
// depending on renderable components.
export type DatasourceMode = 'existing' | 'create' | 'none';
