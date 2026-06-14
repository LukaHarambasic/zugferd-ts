import type { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import type {
	Contact,
	LegalOrganization,
	PostalAddress,
	TaxRegistration,
	TradeParty,
} from "../types/index";
import { NS } from "./namespaces";

export function buildTradeParty(
	parent: XMLBuilder,
	party: TradeParty,
	elementName: string,
): void {
	const el = parent.ele(NS.RAM, elementName);

	if (party.id) {
		el.ele(NS.RAM, "ram:ID").txt(party.id).up();
	}

	if (party.globalIds) {
		for (const globalId of party.globalIds) {
			if (globalId.id) {
				const gidEl = el.ele(NS.RAM, "ram:GlobalID");
				if (globalId.schemeId) {
					gidEl.att(null, "schemeID", globalId.schemeId);
				}
				gidEl.txt(globalId.id).up();
			}
		}
	}

	el.ele(NS.RAM, "ram:Name").txt(party.name).up();

	if (party.description) {
		el.ele(NS.RAM, "ram:Description").txt(party.description).up();
	}

	if (party.legalOrganization) {
		buildLegalOrganization(el, party.legalOrganization);
	}

	if (party.contact) {
		buildContact(el, party.contact);
	}

	buildPostalAddress(el, party.address);

	if (party.electronicAddress) {
		const uriEl = el.ele(NS.RAM, "ram:URIUniversalCommunication");
		const uriIdEl = uriEl.ele(NS.RAM, "ram:URIID");
		if (party.electronicAddress.schemeId) {
			uriIdEl.att(null, "schemeID", party.electronicAddress.schemeId);
		}
		uriIdEl.txt(party.electronicAddress.id).up();
		uriEl.up();
	}

	if (party.taxRegistrations) {
		buildTaxRegistrations(el, party.taxRegistrations);
	}

	el.up();
}

export function buildLegalOrganization(
	parent: XMLBuilder,
	legalOrg: LegalOrganization,
): void {
	const el = parent.ele(NS.RAM, "ram:SpecifiedLegalOrganization");

	if (legalOrg.id) {
		const idEl = el.ele(NS.RAM, "ram:ID");
		if (legalOrg.schemeId) {
			idEl.att(null, "schemeID", legalOrg.schemeId);
		}
		idEl.txt(legalOrg.id).up();
	}

	if (legalOrg.tradingName) {
		el.ele(NS.RAM, "ram:TradingBusinessName").txt(legalOrg.tradingName).up();
	}

	el.up();
}

export function buildContact(parent: XMLBuilder, contact: Contact): void {
	const el = parent.ele(NS.RAM, "ram:DefinedTradeContact");

	if (contact.name) {
		el.ele(NS.RAM, "ram:PersonName").txt(contact.name).up();
	} else if (contact.department) {
		el.ele(NS.RAM, "ram:DepartmentName").txt(contact.department).up();
	}

	if (contact.phone) {
		const phoneEl = el.ele(NS.RAM, "ram:TelephoneUniversalCommunication");
		phoneEl.ele(NS.RAM, "ram:CompleteNumber").txt(contact.phone).up();
		phoneEl.up();
	}

	if (contact.fax) {
		const faxEl = el.ele(NS.RAM, "ram:FaxUniversalCommunication");
		faxEl.ele(NS.RAM, "ram:CompleteNumber").txt(contact.fax).up();
		faxEl.up();
	}

	if (contact.email) {
		const emailEl = el.ele(NS.RAM, "ram:EmailURIUniversalCommunication");
		emailEl.ele(NS.RAM, "ram:URIID").txt(contact.email).up();
		emailEl.up();
	}

	el.up();
}

export function buildPostalAddress(
	parent: XMLBuilder,
	address: PostalAddress,
): void {
	const el = parent.ele(NS.RAM, "ram:PostalTradeAddress");

	if (address.postalCode) {
		el.ele(NS.RAM, "ram:PostcodeCode").txt(address.postalCode).up();
	}

	if (address.lineOne) {
		el.ele(NS.RAM, "ram:LineOne").txt(address.lineOne).up();
	}

	if (address.lineTwo) {
		el.ele(NS.RAM, "ram:LineTwo").txt(address.lineTwo).up();
	}

	if (address.lineThree) {
		el.ele(NS.RAM, "ram:LineThree").txt(address.lineThree).up();
	}

	if (address.city) {
		el.ele(NS.RAM, "ram:CityName").txt(address.city).up();
	}

	el.ele(NS.RAM, "ram:CountryID").txt(address.countryCode).up();

	if (address.countrySubdivision) {
		el.ele(NS.RAM, "ram:CountrySubDivisionName")
			.txt(address.countrySubdivision)
			.up();
	}

	el.up();
}

export function buildTaxRegistrations(
	parent: XMLBuilder,
	registrations: TaxRegistration[],
): void {
	for (const reg of registrations) {
		if (reg.id) {
			const regEl = parent.ele(NS.RAM, "ram:SpecifiedTaxRegistration");
			regEl
				.ele(NS.RAM, "ram:ID")
				.att(null, "schemeID", reg.schemeId)
				.txt(reg.id)
				.up();
			regEl.up();
		}
	}
}
