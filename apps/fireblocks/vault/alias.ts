// enum AliasType {
//     EMAIL = 'EMAIL',
//     PHONE = 'PHONE',
//     OTHER = 'OTHER'
// };

export class Alias {
    id: string;
    alias: string;
    type: string;   //AliasType
    description: string;
};