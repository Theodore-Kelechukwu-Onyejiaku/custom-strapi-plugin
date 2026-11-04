import * as React from 'react';
import { Table } from '@strapi/strapi/admin';

// Row, Cell and Empty accept children (and Empty a `content`) at runtime — Content Manager's
// own list view uses them that way. Their prop types do not say so: they are declared as
// `interface RowProps extends RawTrProps {}`, and RawTrProps is a polymorphic type alias, so
// extending it in an interface loses the members TypeScript would otherwise see.
//
// That is an upstream typing quirk rather than anything this plugin does, so it is narrowed
// to these three aliases instead of being worked around at every call site.
type WithChildren = { children?: React.ReactNode };

export const Row = Table.Row as unknown as React.FC<WithChildren>;
export const Cell = Table.Cell as unknown as React.FC<WithChildren>;
export const Empty = Table.Empty as unknown as React.FC<{ content?: string }>;
