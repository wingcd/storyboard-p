import { BaseComponent } from "./BaseComponent";
import { disallow_multiple_component, enable_replaced_component } from "../annotations/Component";

@disallow_multiple_component()
@enable_replaced_component({containsChildType: true, containsSameParentType: true, containsParentType: true})
export class BaseDisplayComponent extends BaseComponent {
    
}