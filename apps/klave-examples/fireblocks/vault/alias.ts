import { JSON } from '@klave/sdk';
// enum AliasType {
//     EMAIL = 'EMAIL',
//     PHONE = 'PHONE',
//     OTHER = 'OTHER'
// };

@JSON
export class Alias {
    id: string;
    alias: string;
    type: string;   //AliasType
    description: string;
};