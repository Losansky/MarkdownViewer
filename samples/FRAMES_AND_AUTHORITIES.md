# Official reference frames and geodetic authorities (FSB phase 1)

**Date:** 2026-09-03 (PT)  
**Author:** Research Librarian  
**Status:** draft  
**Scope:** Phase-1 bodies only — Earth, Moon, Mars, plus a simulated asteroid used for modeling. Simulated-asteroid poses are **DECLARED**; the sim body is not a surveyed real asteroid and is not Bennu, Eros, or Ryugu.  
**Corpus:** `research/SOURCE_THIS_THREAD.md` is **prior art + design intent, not surveyed data**. Named LunaNet / IAU / LLR items from that corpus are cited here from official URLs/DOIs harvested in the scratch files. No coordinates, unpublished frame parameters, frequencies, or bibliographic details are invented.  
**This note does not** write schema fields, hardware specifications, registry APIs, or patent text.

**Legend**

| Tag | Meaning |
|---|---|
| **FACT** | Stated in a cited official / primary source (URL and/or DOI given). |
| **INFERENCE** | Reasonable reading across sources. Not a new definition, not an unpublished parameter, and **not** a claim that any organization requested, endorsed, or adopted FSB. |
| **GAP** | Official source not retrieved, not yet published, or not independently confirmed in this harvest. Do not fill with guesses. |
| **CONFLICT** | Corpus wording vs official naming or vs the status of a cited document family. Flagged in §2; do not silently reconcile. |
| **prefer-open** | Rank for schema *reference*: freely downloadable official products preferred over paywalled or PKI-gated ones. Does not create a new frame name. |

---

## 1. Frames table

Columns: official frame/datum name; body; purpose (surface nav / dynamics / inertial / time / meta); SANA and/or NAIF name if any; citation (title, org, year, URL/DOI); license/cost; prefer-open; authorities that publish or operationally use it; FACT vs INFERENCE notes. Names only — **do not redefine** these frames in any later schema.

| Frame/datum | Body | Purpose | SANA/NAIF | Citation (title, org, year, URL/DOI) | License/cost | Prefer-open | Authorities | Notes |
|---|---|---|---|---|---|---|---|---|
| **ITRF2020** | Earth | Surface nav / geodetic (crust-fixed TRF) | SANA: `ITRF` / `ITRFyyyy` (OID 1.3.112.4.57.2.38 / .13). NAIF: high-precision Earth-fixed often via binary PCK (e.g. `ITRF93` family; **not** identical product name) | Altamimi et al., *Analysis and results of ITRF2020*, IERS Technical Note No. 41, IERS/BKG, 2024. DOI [10.60599/iers-tn41](https://doi.org/10.60599/iers-tn41); PDF [iers.org TN41](https://www.iers.org/fileadmin/SharedDocs/Publikationen/EN/IERS/Publications/tn/TechnNote41/tn41.pdf). Journal: Altamimi et al., *ITRF2020…*, *J. Geodesy* 97:47, 2023, DOI [10.1007/s00190-023-01738-w](https://doi.org/10.1007/s00190-023-01738-w). Products: [itrf.ign.fr/en/solutions/ITRF2020](https://itrf.ign.fr/en/solutions/ITRF2020); dataset DOI [10.18715/IPGP.2023.LDVIOBNL](https://doi.org/10.18715/IPGP.2023.LDVIOBNL) | Free public products | **true** | IERS ITRS Center (IGN/IPGP); IVS / ILRS / IGS / IDS | **FACT:** Realization of ITRS. **FACT:** Distinct from WGS 84 TRF (aligned closely by design). **INFERENCE:** Prefer naming the specific realization (`ITRF2020`) over bare `ITRF`. |
| **WGS 84** (system + current TRF realization **WGS 84 (G2296)**) | Earth | Surface nav / GNSS (DoD global) | SANA: `WGS84` (OID 1.3.112.4.57.2.36). NAIF: no single built-in `WGS84` body-fixed alias equivalent to ITRF binary PCK | NGA Standardization Document *Department of Defense World Geodetic System 1984…*, **NGA.STND.0036_1.0.0_WGS84** (updated 8 Jul 2014), NGA Office of Geomatics: [earth-info.nga.mil WGS 84](https://earth-info.nga.mil/index.php?action=wgs84&dir=wgs84). Realization G2296: [earth-info.nga.mil GNSS](https://earth-info.nga.mil/index.php?action=gnss&dir=gnss); IGSMail-8444; public-release PDF announced as `WGS 84(G2296).pdf` (NGA-U-2024-00348) | Free / public docs; some NGA registries may need PKI for DISR entry | **true** for definition docs and G2296 note; DISR may be restricted | NGA; USSF GPS; ICAO / NATO / IHO users per NGA description | **FACT:** ECEF datum for GPS. **FACT:** G2296 aligned to ITRF2020 (NGA, Jan 2024). **FACT:** SANA lists WGS84; SANA frame-type metadata says “Inertial” — treat as registry naming artifact; NGA defines ECEF. **INFERENCE:** Schema should allow both system name `WGS 84` and realization tag `G2296`. |
| **NAD 83** | Earth | Surface nav (national example, North America) | — (not a SANA CB frame value) / — | Schwarz, C.R. (ed.), *North American Datum of 1983*, NOAA Professional Paper NOS 2, NGS/NOS/NOAA, Dec 1989. PDF: [geodesy.noaa.gov/library/pdfs/NOAA_PP_NOS_0002.pdf](https://geodesy.noaa.gov/library/pdfs/NOAA_PP_NOS_0002.pdf); [repository.library.noaa.gov/view/noaa/19590](https://repository.library.noaa.gov/view/noaa/19590). NGS FAQ: [ngs.noaa.gov/datums/faq.shtml](https://www.ngs.noaa.gov/datums/faq.shtml) | Free U.S. Government work | **true** | NGS (NOAA); Canada/Mexico partners historically | **FACT:** Geocentric horizontal datum using GRS80 ellipsoid. **FACT:** National/continental example, not a global TRF. **INFERENCE:** Cite as regional/national example only. |
| **GRS80** (Geodetic Reference System 1980 ellipsoid) | Earth | Surface nav (ellipsoid / geometric reference) | — / shape constants appear in SPICE text PCKs for Earth (not a SPICE “frame”) | Moritz, H., *Geodetic Reference System 1980*, *Bulletin Géodésique* 54(3):395–405, 1980. DOI [10.1007/BF02521480](https://doi.org/10.1007/BF02521480). NGS modernized storage policy: Smith et al., NOAA TM NOS NGS 97, 2024, DOI [10.25923/fp6e-wm47](https://doi.org/10.25923/fp6e-wm47) | Journal may be paywalled; definition widely republished by NGS/IAG | **true** for NGS republications of parameters | IAG/IUGG (definition); NGS (operational use with NAD 83 / NSRS) | **FACT:** Ellipsoid/system of constants, not a full TRF. **FACT:** Basis for NAD 83. **INFERENCE:** Reference by name for ellipsoid; do not redefine constants. Numeric parameters: use Moritz/NGS docs — do not invent. |
| **ETRS89** | Earth | Surface nav (regional Europe example) | — / — | EUREF Resolution Firenze 1990 (definition). *EUREF Technical Note 1: Relationship and Transformation between the International and the European Terrestrial Reference Systems*, Mar 2024. URL: [etrs89.ensg.ign.fr/pub/EUREF-TN-1-Mar-04-2024.pdf](http://etrs89.ensg.ign.fr/pub/EUREF-TN-1-Mar-04-2024.pdf); portal [etrs89.ensg.ign.fr](http://etrs89.ensg.ign.fr/); overview [euref.eu](https://www.euref.eu/european-geodetic-reference-systems) | Free PDF from EUREF/IGN | **true** | EUREF (IAG); European NMCAs; Eurocontrol | **FACT:** Coincident with ITRS at epoch 1989.0, fixed to stable Eurasia. **FACT:** Realizations labelled ETRFyy from ITRFyy. **INFERENCE:** Regional example analogous to NAD 83. HTTP fetch of TN1 was flaky in the frames harvest — cite URL; confirm file locally before any numeric transforms (**GAP** on local bytes). |
| **ICRF3** (realization of **ICRS**) | Earth / solar-system barycentric inertial | Inertial | SANA: `ICRF` / `ICRFn` (OID 1.3.112.4.57.2.37 / .11); GCRF as geocentric counterpart `GCRFn`. NAIF: SPICE inertial base often labelled `J2000` (axes closely aligned to ICRF; see Frames Required Reading) | Charlot et al., *The third realization of the International Celestial Reference Frame…*, *A&A* 644:A159, 2020. DOI [10.1051/0004-6361/202038368](https://doi.org/10.1051/0004-6361/202038368). IERS: [iers.org ICRF3](https://www.iers.org/iers/en/dataproducts/icrf/icrf3/icrf3). IAU adopted 2018; in force 2019-01-01 (**FACT** per paper/IERS) | IERS catalog free; journal OA status varies | **true** for IERS products | IAU; IERS ICRS Product Centre; IVS | **FACT:** ICRS is the system; ICRF3 is the VLBI realization. **FACT:** Axes barycentric; GCRF is geocentric parallel. **INFERENCE:** Name `ICRF3` or `ICRS` explicitly; do not invent aliases. |
| **Mean Earth / polar axis (ME)**; SPICE **`MOON_ME`** | Moon | Surface nav / cartography | SANA: `MOON_ME` (OID 1.3.112.4.57.2.22). NAIF: `MOON_ME` (generic alias); DE-specific e.g. `MOON_ME_DE440_ME421` | SANA registry: [sanaregistry.org celestial_body_reference_frames](https://sanaregistry.org/r/celestial_body_reference_frames/); record [records/22](https://sanaregistry.org/r/celestial_body_reference_frames/records/22). NAIF lunar FK readme: [aareadme.txt](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/aareadme.txt); kernel [moon_de440_250416.tf](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf). LRO/LGCWG white paper family: Ver. 4, 451-SCI-000958, 2008-05-14 [PDS LRO_Coordinate_System.pdf](https://pds-imaging.jpl.nasa.gov/documentation/LRO_Coordinate_System.pdf); Version 5, 2008-10-01 [science.nasa.gov luncoordwhitepaper-10-08.pdf](https://science.nasa.gov/wp-content/uploads/2024/01/luncoordwhitepaper-10-08.pdf). LEAG: [ME-White-Paper_Final.pdf](https://www.lpi.usra.edu/leag/reports/ME-White-Paper_Final.pdf). Park et al. 2021 DE440 DOI [10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414). WGCCRE 2015 report Archinal et al. 2018 DOI [10.1007/s10569-017-9805-5](https://doi.org/10.1007/s10569-017-9805-5) | Free NAIF kernels, SANA, NASA/LEAG PDFs | **true** | IAU WGCCRE (cartographic recommendation); NASA LRO/LOLA; USGS Astrogeology; NAIF; JPL SSD | **FACT:** Preferred for topography / PDS archival / cartography. **FACT:** Constant rotation from PA for a given DE. **FACT:** Current generic `MOON_ME` for DE440 is `MOON_ME_DE440_ME421` (aligned to DE421 ME) — see §2.1. **CONFLICT (status):** formal WGCCRE CMDA report still DE421-era; DE440 alignment is JPL/NAIF + WGCCRE-author abstracts, not a retrieved successor CMDA report. |
| **Principal Axis (PA)**; SPICE **`MOON_PA`** | Moon | Dynamics / gravity / ephemeris orientation | SANA: `MOON_PAxxx` (OID 1.3.112.4.57.2.24). NAIF: `MOON_PA` (generic); e.g. `MOON_PA_DE440` | Same NAIF aareadme + `moon_de440_250416.tf`. Park et al., *The JPL Planetary and Lunar Ephemerides DE440 and DE441*, *AJ* 161:105, 2021, DOI [10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414). SANA `MOON_PAxxx` record on the celestial-body frames registry | Free kernels + AJ article | **true** for NAIF kernels | JPL SSD / NAIF; dynamical users (GRAIL etc.) | **FACT:** Aligned with principal inertia axes; used with lunar orientation PCK. **FACT:** PA vs ME differ by a small constant rotation (DE-dependent). **INFERENCE:** Do not use PA as the default cartographic name for surface beacons. See §2.2. Do not invent a single reconciled PA–ME offset (official secondaries scatter: ~860 m / ~875 m / ~1 km). |
| **`IAU_MOON`** | Moon | Legacy / low-precision body-fixed (**avoid** for high accuracy) | — / `IAU_MOON` (built-in PCK-style) | NAIF lunar-earth PCK-FK tutorial: [23_lunar-earth_pck-fk.pdf](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/23_lunar-earth_pck-fk.pdf); aareadme warns default association is IAU_MOON | Free | **true** | NAIF | **FACT:** Exists in SPICE. **FACT:** NAIF cautions it cannot reference high-accuracy lunar orientation; use `MOON_ME` / `MOON_PA`. |
| **DE421 / DE440 lunar orientation** (ephemeris-tied PA/ME realizations) | Moon | Dynamics + cartographic realization binding | Tied to `MOON_PA*` / `MOON_ME*` / via FK+binary PCK: e.g. `moon_de440_250416.tf` + `moon_pa_de440_200625.bpc`; legacy DE421 `moon_080317.tf` + `moon_pa_de421_1900-2050.bpc` | Park et al. 2021 DOI [10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414); NAIF aareadme and `moon_de440_250416.tf` (fetched). Folkner et al. DE421 historical memo cited in LRO/LOLA catalog materials | Free NAIF kernels | **true** | JPL; NAIF; LRO heritage used DE421 ME | **FACT:** Orientation realization is DE-specific. **FACT:** Current generic `MOON_ME` for DE440 is `MOON_ME_DE440_ME421`. **INFERENCE:** Schema should allow citing DE version alongside frame name. See §2.1 **CONFLICT**. |
| **IAU Mars cartographic / areocentric (WGCCRE)** | Mars | Surface nav / cartography | SANA: realized via `FIXED_CB` + CENTER_NAME=Mars (SANA cites WGCCRE algorithm). NAIF: typically `IAU_MARS` | Archinal et al., *Report of the IAU WGCCRE: 2015*, *Celest. Mech. Dyn. Astr.* 130:22, 2018. DOI [10.1007/s10569-017-9805-5](https://doi.org/10.1007/s10569-017-9805-5); USGS: [usgs.gov/publications/…2015](https://www.usgs.gov/publications/report-iau-working-group-cartographic-coordinates-and-rotational-elements-2015); WGCCRE site: [astrogeology.usgs.gov/groups/iau-wgccre](https://astrogeology.usgs.gov/groups/iau-wgccre). Correction note Archinal et al. 2019 DOI [10.1007/s10569-019-9925-1](https://doi.org/10.1007/s10569-019-9925-1). Astropedia reprint: [WGCCRE2015reprint.pdf](https://astropedia.astrogeology.usgs.gov/download/Docs/WGCCRE/WGCCRE2015reprint.pdf) | Springer article; USGS/Astropedia reprints often free | **true** when using USGS reprint | IAU WGCCRE; USGS Astrogeology | **FACT:** Report exists and updates Mars orientation/longitude definition. **GAP:** Numeric table parameters **not copied here** — Astropedia PDF binary fetch failed in both frames and corpus harvests; cite DOI/URL only; do not invent radii/orientation numbers. |
| **`IAU_MARS`** | Mars | Body-fixed (SPICE / IAU rotation model) | — / `IAU_MARS` (built-in PCK-based) | NAIF Frames tutorials ([17_frames…](https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/Tutorials/pdf/individual_docs/17_frames_and_coordinate_systems.pdf)); generic PCK comments e.g. [mars_iau2000_v1.tpc](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/mars_iau2000_v1.tpc) cite Archinal et al. 2018 | Free | **true** | NAIF; IAU WGCCRE parameters in PCKs | **FACT:** Standard SPICE Mars body-fixed name. **FACT:** Distinct from inertial `MARSIAU` (legacy; no relation beyond Mars). |
| **MOLA / MGS operational cartographic usage (IAU2000 areocentric)** | Mars | Surface nav (heritage topography) | — / uses `IAU_MARS` orientation models of the era; instrument frame `MGS_MOLA` is spacecraft/instrument, **not** body cartographic | MOLA PEDR catalog: [pedrds.cat](https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-3-pedr-l1a-v1/mgsl_21xx/catalog/pedrds.cat); PDS MOLA overview [pds-geosciences.wustl.edu/missions/mgs/mola.html](https://pds-geosciences.wustl.edu/missions/mgs/mola.html) | Free PDS | **true** | MGS MOLA team; PDS Geosciences | **FACT:** Final PEDR/MEGDR use IAU2000 planetocentric, east-positive longitude. **FACT:** Older products used IAU1991. **INFERENCE:** Reference as operational cartographic usage of IAU Mars models, not a separate named datum. |
| **IAU WGCCRE small-body procedure** | Asteroid analogs | Surface / body-fixed definition **procedure** | SANA `FIXED_CB` cites WGCCRE reports / mission-specific FKs or built-in `IAU_*` when coded | Archinal et al. 2018 WGCCRE report (DOI [10.1007/s10569-017-9805-5](https://doi.org/10.1007/s10569-017-9805-5)); small-body pole/PM and right-hand rule discussion in that report | Same as WGCCRE; prefer USGS reprints | **true** (USGS reprints) | IAU WGCCRE | **FACT:** Procedure for defining small-body coordinates exists in WGCCRE reports. **FACT:** Not a single named frame for arbitrary bodies. |
| **`IAU_BENNU`** (**ANALOG only**) | Asteroid analog (Bennu / OSIRIS-REx) | Body-fixed surface / dynamics (example) | — / `IAU_BENNU` | OSIRIS-REx FK e.g. [orx_v03.tf](https://naif.jpl.nasa.gov/pub/naif/ORX/kernels/fk/orx_v03.tf); PCK `bennu_v17.tpc`; PDS archive [orex_spice](https://naif.jpl.nasa.gov/pub/naif/pds/pds4/orex/orex_spice/) | Free NAIF/PDS | **true** | NAIF; OSIRIS-REx / NASA | **FACT:** Official mission body-fixed name for (101955) Bennu. **FACT:** FSB simulated asteroid is **not** Bennu. |
| **`EROS_FIXED`** (**ANALOG only**) | Asteroid analog (433 Eros / NEAR) | Body-fixed (example) | — / `EROS_FIXED` (ID 2000433) | NEAR FK [eros_fixed.tf](https://naif.jpl.nasa.gov/pub/naif/pds/data/near-a-spice-6-v1.0/nearsp_1000/data/fk/eros_fixed.tf); DSK comments cite same frame | Free | **true** | NAIF; NEAR | **FACT:** Official NEAR body-fixed frame name. **ANALOG only.** |
| **`RYUGU_FIXED`** / built-in **`IAU_RYUGU`** (**ANALOG only**) | Asteroid analog (162173 Ryugu / Hayabusa2) | Body-fixed (example) | — / mission FK `RYUGU_FIXED`; Toolkit built-in `IAU_RYUGU` (newer Toolkit versions) | Hayabusa2 FK [hyb2_ryugu_v01.tf](https://naif.jpl.nasa.gov/pub/naif/pds/pds4/hyb2/hyb2_spice/spice_kernels/fk/hyb2_ryugu_v01.tf) (defines `RYUGU_FIXED`); coordinate description [Ryugu_Coordinate_System_Description.pdf](https://sbnarchive.psi.edu/pds4/hayabusa2/hyb2/document/Ryugu_Coordinate_System_Description.pdf) | Free | **true** | JAXA/ISAS; NAIF; Hayabusa2 | **FACT:** Mission kernel name `RYUGU_FIXED`; later Toolkit adds `IAU_RYUGU`. **ANALOG only.** |
| **FSB simulated asteroid body-fixed frame** | Asteroid (FSB sim) | Modeling only; poses **DECLARED** | — / — | — (no official IAU/NAIF/SANA name) | N/A | N/A | FSB project (not a survey authority) | **FACT:** There is **no** official IAU/NAIF/SANA frame for the FSB simulated asteroid. Poses stay declared; do not treat the sim body as Bennu/Eros/Ryugu. **Do not invent** a name. |
| **UTC** | Time | Time (Earth metadata / civil) | SANA time systems registry (related; see CCSDS NAV docs) / SPICE LSK ↔ UTC via `str2et` / `et2utc` | ITU-R Recommendation **TF.460-6** (2002), *Standard-frequency and time-signal emissions*: [itu.int/rec/R-REC-TF.460-6](https://www.itu.int/rec/R-REC-TF.460-6-200202-I/en). BIPM/CGPM Resolution 2 (2018): [bipm.org …/resolution-2](https://www.bipm.org/en/committees/cg/cgpm/26-2018/resolution-2). OSTP 2024: “UTC is the primary time standard used by Earth-based systems today.” [Celestial-Time-Standardization-Policy.pdf](https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/04/Celestial-Time-Standardization-Policy.pdf) | Free download | **true** | ITU-R; BIPM; IERS (leap seconds / UT1) | **FACT:** Civil/international reference time scale; differs from TAI by integer leap seconds. Corpus: UTC for Earth metadata — **FACT** via ITU/BIPM/OSTP. See §2.4 for lunar time **CONFLICT**. |
| **TAI** | Time | Time | — / supported in SPICE time conversions | BIPM; CGPM Resolution 2 (2018) defining TAI/UTC relationship: [bipm.org …/resolution-2](https://www.bipm.org/en/committees/cg/cgpm/26-2018/resolution-2); BIPM Time Department / Circular T | Free BIPM publications | **true** | BIPM | **FACT:** Continuous atomic scale; TT ≈ TAI + 32.184 s (conventional offset). |
| **TT** (Terrestrial Time) | Time | Time / dynamics (geocentric) | — / used with ephemerides; SPICE ET related to TDB | IAU Resolution B1.9 (2000); IERS Conventions (2010), IERS Technical Note 36 (Petit & Luzum): [iers.org tn36](https://www.iers.org/IERS/EN/Publications/TechnicalNotes/tn36.html); CGPM Res. 2 (2018) | Free IAU/IERS texts | **true** | IAU; BIPM; IERS | **FACT:** Coordinate time in GCRS; realization via TAI + offset. |
| **TDB** (Barycentric Dynamical Time) | Time | Time / dynamics (barycentric; SPICE ET) | — / SPICE Ephemeris Time (ET) treated as TDB for planetary ephemerides | IAU Resolution B3 (2006): [IAU2006_Resol3.pdf](https://iauarchive.eso.org/static/resolutions/IAU2006_Resol3.pdf); IERS TN 36 Ch. 10 | Free | **true** | IAU; JPL ephemerides / NAIF | **FACT:** Linear transform of TCB; used as independent argument of DE ephemerides. |
| **LunaNet Reference Time (LRT) / Coordinated Lunar Time (LTC)** | Time (lunar) | Time (lunar epochs) | — / — | LNIS v5 (NASA/ESA/JAXA, effective 2025-01-29): [lunanet-interoperability-specification-v5-baseline.pdf](https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-interoperability-specification-v5-baseline.pdf) — uses **LRT**; AD5 *Lunar Reference System and LunaNet Reference Time System Standard* is `{LNIS-TBD-AD0005}` (not yet available). White House OSTP, *Policy on Celestial Time Standardization…*, 2024-04-02: [Celestial-Time-Standardization-Policy.pdf](https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/04/Celestial-Time-Standardization-Policy.pdf) — uses **LTC** | Spec PDF free; AD5 missing | **true** when published | NASA SCaN / LunaNet; OSTP (U.S. policy); international partners TBD | **CONFLICT (nomenclature):** corpus conflates LTC (OSTP) with LRT (LNIS). Official docs use **different names**; do **not** invent an equivalence. **GAP:** AD5 not published. See §2.4. |
| **CCSDS SANA Celestial Body Reference Frames registry** | Meta | Registry of frame names for CCSDS NAV | Registry OID **1.3.112.4.57.2** / many values map to SPICE-like names (`MOON_ME`, `ITRF`, `ICRF`, …) | [https://sanaregistry.org/r/celestial_body_reference_frames/](https://sanaregistry.org/r/celestial_body_reference_frames/) (39 Assigned records in frames harvest). Policy: Expert Review; Authority CCSDS.MOIMS.NAV. Related: CCSDS 500.0-G-4 *Navigation Data—Definitions and Conventions* | Free public registry | **true** | CCSDS / SANA | **FACT:** Normative name registry for CCSDS messages. **INFERENCE:** Prefer SANA spelling when exchanging CCSDS products. **GAP:** CCSDS 500.0-G-4 full PDF not re-fetched in corpus harvest (non-blocking for `MOON_ME`). |
| **SPICE Toolkit / NAIF kernels** | Meta / all bodies | Software + kernels enabling named frames | — / entire frame subsystem | NAIF Rules / SPICE Software License: [naif.jpl.nasa.gov/naif/rules.html](https://naif.jpl.nasa.gov/naif/rules.html). Toolkit: [naif.jpl.nasa.gov/naif/toolkit.html](https://naif.jpl.nasa.gov/naif/toolkit.html). PDS OSS policy notes SPICE exemption from Apache-2 default | **Free**, no fee; redistribution of *unmodified Toolkit package* restricted without NAIF clearance; kernels redistributable if unmodified; commercial use allowed. NASA/NAIF custom license, **not** OSI-approved Apache/NOSA | **true** with redistribution caveat | NASA/JPL NAIF; PDS | **FACT:** Source available; TSPA export. **FACT:** Not standard NOSA/Apache for Toolkit core. |

---

## 2. Corpus-named items

Source of claims: `research/SOURCE_THIS_THREAD.md` (prior art + design intent, **not surveyed data**). Official citations harvested in `research/_scratch_corpus_cites.md`. Each item states FACT / GAP / CONFLICT against that harvest. **No invented coordinates, frequencies, frame parameters, or bibliographic details.**

### 2.1 Moon ME / DE440 aligned to DE421 ME / IAU WGCCRE

**Corpus claim:** Moon surface maps/nav use Mean Earth / polar axis (ME); realization tied to JPL DE440 ME aligned to DE421 ME (IAU WGCCRE direction).

| Source | What it supports |
|---|---|
| IAU WGCCRE 2015 report, Archinal et al. 2018, *CMDA* 130:22, DOI [10.1007/s10569-017-9805-5](https://doi.org/10.1007/s10569-017-9805-5); USGS Pubs Warehouse; Astropedia reprint URL | **FACT:** Official WGCCRE report DOI/URL. **GAP:** PDF body bytes not retrieved (TLS/fetch failure); verbatim ME recommendation therefore quoted via LEAG WP + WGCCRE-author abstracts + NAIF, not from the CMDA PDF body. |
| LEAG, *Continued Use of the Mean Earth (ME) Coordinate System for the Moon*, [ME-White-Paper_Final.pdf](https://www.lpi.usra.edu/leag/reports/ME-White-Paper_Final.pdf) | **FACT (retrieved):** “ME is defined by having 0° longitude in the mean direction of the Earth and an equator defined by the mean direction of the lunar rotation pole, and it is the current standard for mapping and defining surface coordinates.” Also: LRO/LGCWG recommended JPL DE 421 rotated into ME (2008); “The WGCCRE made the same recommendation in 2011 [2] and 2018 [3].” |
| Park et al., *The JPL Planetary and Lunar Ephemerides DE440 and DE441*, *AJ* 161:105, 2021, DOI [10.3847/1538-3881/abd414](https://doi.org/10.3847/1538-3881/abd414) | **FACT (retrieved):** “Most of lunar cartographic products are defined relative to the DE421 mean-Earth/mean-rotation (MER) frame.” Rotation from DE440 PA to DE421 MER estimated by comparing lunar retroreflector coordinates. |
| NAIF `moon_de440_250416.tf` (2025-04-16) + [aareadme.txt](https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/aareadme.txt) | **FACT (retrieved):** For DE440 the kernel specifies `MOON_PA_DE440` and `MOON_ME_DE440_ME421`. “`MOON_ME` is an alias for the frame `MOON_ME_DE440_ME421`, which is closely aligned with the lunar mean Earth/polar axis frame associated with the planetary ephemeris DE421.” |
| Archinal et al., LPSC 2024 abstract 1696, [1696.pdf](https://www.hou.usra.edu/meetings/lpsc2024/pdf/1696.pdf); LPSC 2023 abstract 2305, [2305.pdf](https://www.hou.usra.edu/meetings/lpsc2023/pdf/2305.pdf) | **FACT:** WGCCRE-affiliated authors describe a DE440 ME derived under a no-net-rotation condition from DE421 ME (LPSC 2024 quotes RMS difference 9 cm). LPSC 2023 hopes to include the update in the **next** WGCCRE main report. |

**CONFLICT / caveat vs corpus wording “IAU WGCCRE direction”:** If that phrase is read as a **completed peer-reviewed WGCCRE report** adoption of DE440, it overstates the retrieved record. The formal WGCCRE report still in hand is the 2015/2018 CMDA paper (DE421-era recommendation, via LEAG). DE440-aligned-to-DE421 is **JPL/NAIF operational** (`MOON_ME_DE440_ME421`) **plus WGCCRE-author conference abstracts**, **not** a retrieved successor CMDA report. **Do not invent a post-2015 CMDA report DOI.**

**Status:** OK on ME as cartographic system + DE440 ME aligned to DE421 ME as JPL/NAIF realization; **CONFLICT** on treating WGCCRE *report* adoption of DE440 as complete.

### 2.2 PA vs ME

**Corpus claim:** PA is for dynamics/gravity, not pad coordinates; ME for surface maps/nav.

| Source | What it supports |
|---|---|
| LRO Project / LGCWG, *A Standardized Lunar Coordinate System…*, Version 5, 2008-10-01, [luncoordwhitepaper-10-08.pdf](https://science.nasa.gov/wp-content/uploads/2024/01/luncoordwhitepaper-10-08.pdf) | **FACT (retrieved):** “LRO instrument teams shall deliver data to the PDS with planetocentric coordinates in the ME reference system only.” “The PA reference system is especially useful for dynamical studies in areas such as gravity field determination and lunar laser ranging (LLR).” |
| LEAG ME white paper (URL above) | **FACT:** “The PA system is important for dynamical purposes while the ME system was meant for cartographic purposes.” PA = principal moments of inertia; used for geophysical parameters / gravity field. |
| Archinal & WGCCRE, Planetary Data Workshop 2023 abstract 7095, [7095.pdf](https://www.hou.usra.edu/meetings/planetdata2023/pdf/7095.pdf) | **FACT:** WG has recommended ME for cartography since its initial report; PA-based frames continue to be used for dynamical purposes. |
| SANA `MOON_ME` and `MOON_PAxxx` records, [celestial_body_reference_frames](https://sanaregistry.org/r/celestial_body_reference_frames/) | **FACT:** `MOON_ME` — “preferred lunar frame for associating lunar topography”; “typically used to specify the location of objects on the Moon.” `MOON_PAxxx` — “basis for Lunar gravity models, in the numerical integration of the planetary ephemerides, and as the reference for modern moon gravity solutions.” |

**Notes:** Offset magnitudes differ slightly across official secondaries (LEAG “maximum … 875 meters”; NAIF FK “approximately 875 m”; PDW7095 “approximately 860 meters”; LRO WP “about 1 km”). **Do not invent a single reconciled number.** This scatter is **not** treated as a corpus CONFLICT.

**Status:** OK.

### 2.3 SANA name `MOON_ME`

**Corpus claim:** SANA names exist (e.g. `MOON_ME`). Reuse; do not invent `lunar_xyz_v1`.

- **Title:** Space Assigned Numbers Authority — Celestial Body Reference Frames registry  
- **Org:** SANA under CCSDS (authority CCSDS.MOIMS.NAV); OID **1.3.112.4.57.2**  
- **URL (registry):** https://sanaregistry.org/r/celestial_body_reference_frames/  
- **URL (`MOON_ME` record):** https://sanaregistry.org/r/celestial_body_reference_frames/records/22  
- **OID:** 1.3.112.4.57.2.22  
- **License/cost:** public  
- **Excerpt (FACT, retrieved):** Value `MOON_ME` — “Moon Mean Earth (ME) rotating frame. This is the preferred lunar frame for associating lunar topography. It is defined as a constant rotation from the Principal Axes frame associated with a particular instantiation of the Jet Propulsion Laboratory Development Ephemeris (JPL/DE). Typically, the X axis pointed along the mean direction to the center of the Earth and the Z axis pointing to the mean direction of rotation. The ME frame is typically used to specify the location of objects on the Moon.” Frame type: Body-Fixed. Status: Assigned.  
- **NAIF alignment (FACT):** generic SPICE name `MOON_ME` (alias to `MOON_ME_DE440_ME421` in current DE440 FK).  
- **FACT:** No SANA entry named `lunar_xyz_v1` observed on the retrieved registry page.

**Status:** OK. Schema work (elsewhere) should **reuse** `MOON_ME`; this note does not invent identifiers.

### 2.4 UTC vs LTC / LunaNet Reference Time (LRT)

**Corpus claim:** UTC for Earth metadata; LTC / LunaNet Reference Time for lunar epochs.

**UTC (Earth metadata) — FACT**

- ITU-R TF.460-6 (2002): https://www.itu.int/rec/R-REC-TF.460-6-200202-I/en  
- BIPM/CGPM Resolution 2 (2018): https://www.bipm.org/en/committees/cg/cgpm/26-2018/resolution-2  
- OSTP, 2024-04-02: “UTC is the primary time standard used by Earth-based systems today.” https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/04/Celestial-Time-Standardization-Policy.pdf  

**LRT (LNIS interoperability timescale) — FACT + AD5 GAP**

- *LunaNet Interoperability Specification Document, Version 5*, NASA SCaN (written/approved with ESA and JAXA), LNIS V005 Baseline, **January 29, 2025**, ESC-CCR-0690. PDF: https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-interoperability-specification-v5-baseline.pdf  
- §2.1 (FACT): service products “need to be referred to LunaNet Reference Time (LRT)”; an LNSP “may also provide different offsets (e.g., LST – UTC).”  
- §3.2.3.2 (FACT): each LNSP shall provide PNT either synchronized with LRT “defined in [AD5] – {LNIS-TBD-AD0005}” or provide offsets to LRT; offsets vs other timescales (e.g. UTC) can be provided.  
- Applicable Document: “[AD5] Lunar Reference System and LunaNet Reference Time System Standard {LNIS-TBD-AD0005}” — **not yet published** (“Note: this section is included in this document until [AD5] is available.”). **GAP.**

**LTC (OSTP U.S. policy name) — FACT**

- White House OSTP, *Policy on Celestial Time Standardization in Support of the National Cislunar Science and Technology (S&T) Strategy*, April 2, 2024. https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/04/Celestial-Time-Standardization-Policy.pdf  
- Directs agencies to develop celestial time standards with “Traceability to Coordinated Universal Time (UTC)” and states NASA will include consideration of **Coordinated Lunar Time (LTC)**; strategy for lunar timing standardization due no later than December 31, 2026.

**CONFLICT (nomenclature):** Corpus writes “LTC / LunaNet Reference Time” as if one object. Official documents treat **LTC** (OSTP U.S. policy name: Coordinated Lunar Time) and **LRT / LunaNet Reference Time** (LNIS interoperability timescale) as related lunar-time efforts but use **different names**. LNIS AD5 (which would define LRT in detail) is still `LNIS-TBD-AD0005`. **Do not invent an equivalence.** Quote both names. **GAP:** formal published LTC ≡ LRT not found.

**Status:** UTC OK; LRT named in LNIS v5 OK; LTC named in OSTP OK; **CONFLICT** on conflated naming; **GAP** on AD5.

### 2.5 LNIS v5 (January 2025)

**Corpus claim:** LunaNet Interoperability Spec (LNIS v5, Jan 2025).

- **Title:** LunaNet Interoperability Specification Document, Version 5  
- **Org:** NASA HQ Space Communications and Navigation (SCaN) Control Board; co-developed/approved by NASA, ESA, JAXA  
- **Document / date:** LNIS V005 Baseline, **January 29, 2025**, CR ESC-CCR-0690 (Initial Release)  
- **URL (PDF):** https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-interoperability-specification-v5-baseline.pdf  
- **URL (NASA page):** https://www.nasa.gov/directorates/somd/space-communications-navigation-program/lunanet-interoperability-specification/  
- **DOI:** none stated on the face of the PDF  
- **License/cost:** free public NASA PDF (retrieved)  
- **Excerpt (FACT):** “LNIS V005 | Baseline | January 29, 2025 | ESC-CCR-0690 | Initial Release”  
- **Excerpt (FACT):** “This current version of the document was written and approved by the National Aeronautics and Space Administration (NASA), the European Space Agency (ESA), and the Japan Aerospace Exploration Agency (JAXA).”  
- **IOAG announcement (secondary):** https://ioag.org/announcements/ — “LNIS v5 Released” (2025-02-14), noting baselining after NASA approval on January 29.

**Status:** OK. Corpus “Jan 2025” matches official January 29, 2025 effective date.

### 2.6 AFS frequency (~2492.028 MHz in 2483.5–2500 MHz, SFCG lunar in-situ RNSS band)

**Corpus claim:** AFS ~2492.028 MHz in 2483.5–2500 MHz (SFCG lunar in-situ RNSS band).

**LSIS-AFS (LNIS AD1 Vol A) — FACT, exact carrier**

- *LunaNet Signal-In-Space Recommended Standard – Augmented Forward Signal (LSIS – AFS), VOLUME A, Version 1*, NASA SCaN, effective January 29, 2025 (LSIS V1.0 Baseline, ESC-CCR-0690).  
- URL: https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-signal-in-space-recommended-standard-augmented-forward-signal-vol-a.pdf  
- **FACT:** LANS “is to be provided in the 2483.5-2500 MHz band via the Augmented Forward Signal (AFS).”  
- **FACT (LSIS-010):** “The frequency band allocated to the AFS signal shall be in S-band between 2483.5 MHz and 2500 MHz.”  
- **FACT (note):** “This is in line with Space Frequency Coordination Group (SFCG) recommendation 32-2, that identifies the band between 2483.5 MHz and 2500 MHz for ‘In-situ Lunar based RNSS to Lunar Orbit and Lunar Surface.’”  
- **FACT (LSIS-020):** “The Augmented Forward Signal carrier frequency shall be **2492.028 MHz**.”

**SFCG Recommendation 32-2 — GAP on primary PDF**

- Attempted `sfcgonline.org` Rec 32-2 R5/R6 PDF URLs returned **HTTP 404** in the corpus harvest; recommendations index timed out.  
- Band statement is **FACT via LSIS-AFS quotation** of SFCG Rec 32-2. **Do not invent** SFCG clause numbers or revision text beyond what LSIS quotes.

**NOT a numeric conflict:** Corpus “~2492.028” is an approximate tilde on an **exact** normative **2492.028 MHz** in LSIS-020. Same digits; the tilde is not a different number.

**Status:** OK on LSIS exact carrier and band; **GAP** on SFCG PDF body; **not** a numeric CONFLICT.

### 2.7 LLR: Apollo, Lunokhod, NGLR / ALLR-class single cubes

**Corpus claim:** Lunar laser retroreflectors (Apollo, Lunokhod, NGLR/ALLR-class single cubes) already provide Earth–Moon ranging; single cubes avoid array-tilt pulse smear.

| Source | What it supports |
|---|---|
| ILRS, *Next Generation Lunar Retroreflector-1 (NGLR-1)*, https://ilrs.gsfc.nasa.gov/missions/satellite_missions/current_missions/ngl1_general.html | **FACT:** “The original Apollo retroflectors (on Apollos 11, 14, 15) and the Luna 17 and 21 retroreflectors provided precise coordinates for the lunar reference system that we use today. The LLR data to these retroreflectors form a critical part of the Solar System planetary ephemerides… NGLR will improve upon the Apollo and Luna LLR results by providing sub-millimeter range measurements.” |
| NASA, *NASA Anticipates Lunar Findings From Next-Generation Retroreflector*, 2025-01-02, https://www.nasa.gov/missions/artemis/clps/nasa-anticipates-lunar-findings-from-next-generation-retroreflector/ | **FACT:** NGLR-1 on Firefly Blue Ghost; “A second NGLR retroreflector, called the **Artemis Lunar Laser Retroreflector (ALLR)**, is currently a candidate payload for flight on NASA’s Artemis III mission…” |
| Williams, J. G., et al., *Lunar Laser Ranging Retroreflectors: Velocity Aberration and Diffraction Pattern*, *Planet. Sci. J.* 4:89, 2023, DOI [10.3847/PSJ/acbeab](https://doi.org/10.3847/PSJ/acbeab); UMD host PDF retrieved | **FACT (abstract):** “The new retroreflectors are single 10 cm corner cube retroreflectors that will not spread the laser pulse during reflection like the existing arrays do.” **FACT (body):** arrays rarely face the beam exactly → pulse spreading; cites maximum pulse spreads of “±3 cm for the Lunokhods, ±6 cm for Apollos 11 and 14, and ±11 cm for Apollo 15”; next step is large single CCRs (names NGLR and MoonLIGHT). |

**Notes:** Corpus “Lunokhod” matches Williams/ILRS; ILRS also says “Luna 17 and 21 retroreflectors.” ALLR = Artemis Lunar Laser Retroreflector (NASA), described as a second NGLR-class unit — not a separate unrelated acronym invented here.

**Status:** OK.

### 2.8 Combined LLR + radio/VLBI (proposed cm-class surface-station pin)

**Corpus claim:** Combined LLR + radio/VLBI is proposed to pin a lunar surface station into an Earth/inertial frame at cm-class.

- **Citation:** *NovaMoon: A Strategic Lunar Reference Station for Positioning, Timing, and Largely Enhanced Science in the Earth-Moon System* (multi-author ESA/partner proposal; Argonaut / Moonlight context). arXiv PDF retrieved: https://arxiv.org/pdf/2602.08432 (arXiv id `2602.08432`; **DOI not verified** on the face of the PDF in this harvest).  
- **Status in text (FACT):** “early formulation (Phase A/B1)” — **proposed**, not an operational station.  
- **Excerpt (FACT):** targets “(i) precise determination of the NovaMoon reference position at the centimetre- to sub-decimetre-level through the combination of co-located ranging techniques, including laser ranging, VLBI, and Direct-to-Earth links”; “Its co-located LLR and VLBI systems allow multi-technique contributions to the realisation of lunar reference frames…”  

**Related, not used to invent cm-class alone**

- White House OSTP *Lunar Reference Systems Policy* (2024-12-18), https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/12/Lunar-Reference-System-Policy.pdf — requires lunar body-fixed + inertial systems and “Traceability to Earth’s body-fixed and inertial reference systems”; does **not** itself quote “cm-class” LLR+VLBI station pinning.  
- Park et al. 2021 DE440 uses LLR and spacecraft VLBI/VLBA for **ephemeris** ties to ICRF; that is **not** the same as a co-located lunar surface station beacon. Do not conflate.

**GAP:** If the corpus is read as a **specific named deployed mission** or a **standards-body requirement** already mandating cm-class LLR+VLBI station ties — not found as a baselined LNIS/AD5 requirement in retrieved docs. Proposal-class only.

**Status:** OK as **proposal**; **GAP** as operational/standards mandate.

### 2.9 Corpus harvest index (OK / GAP / CONFLICT)

| # | Corpus item | URL/DOI found? | Primary retrieved? | Flag |
|---|-------------|----------------|--------------------|------|
| 1 | ME / DE440↔DE421 / WGCCRE | Yes (DOI 10.1007/s10569-017-9805-5; DOI 10.3847/1538-3881/abd414; NAIF FK; LEAG; LPSC) | Yes except WGCCRE PDF body | **CONFLICT** (formal WGCCRE DE440 report still pending) |
| 2 | PA vs ME roles | Yes (LRO WP; LEAG; PDW7095; SANA) | Yes | OK (offset-number scatter; do not reconcile) |
| 3 | SANA `MOON_ME` | Yes (sanaregistry.org) | Yes | OK |
| 4 | UTC / LTC / LRT | Yes (LNIS v5; OSTP LTC memo) | Yes | **CONFLICT** nomenclature LTC vs LRT; **GAP** AD5 |
| 5 | LNIS v5 Jan 2025 | Yes (NASA PDF) | Yes | OK |
| 6 | AFS 2492.028 / 2483.5–2500 / SFCG | Yes for AFS (LSIS); SFCG via LSIS quote | LSIS yes; **SFCG PDF GAP** | Corpus “~” vs LSIS exact 2492.028 — **NOT** a numeric conflict |
| 7 | Apollo / Lunokhod / NGLR / ALLR / pulse smear | Yes (ILRS; NASA; DOI 10.3847/PSJ/acbeab) | Yes | OK |
| 8 | Combined LLR+VLBI cm-class station | Yes (arXiv NovaMoon proposal) | Yes (proposal) | OK as proposal; **GAP** as deployed/LNIS mandate |

---

## 3. Authorities

**Definition used only in this note:** FSB = durable survey-grade markers on mappable celestial bodies (phase 1: Earth, Moon, Mars + simulated asteroid for modeling) with a public schema and named-authority attestation.

**FACT (this scan):** **No organization has requested, endorsed, or adopted FSB.** Mandate and program cells are FACT with official URLs. The FSB-fit column is **INFERENCE only** — theoretical adjacency to a cited program, not a request.

| Org | Mandate (FACT + URL) | Program (FACT + URL) | FSB fit (INFERENCE only) |
|---|---|---|---|
| NOAA National Geodetic Survey (NGS) | “To define, maintain and provide access to the National Spatial Reference System…” https://geodesy.noaa.gov/web/about_ngs/info/mission-strategic-planning.shtml ; NSRS includes “a network of permanently marked points” and CORS https://geodesy.noaa.gov/INFO/facts/nsrs.shtml | NSRS modernization; NAPGD2022 https://beta.ngs.noaa.gov/NAPGD2022/index.html ; https://www.ngs.noaa.gov/datums/newdatums/release.shtml | Earth-domain FSB-like registry could resemble NGS’s published survey marks + CORS under a named national frame — because that is already how NSRS access works, not because NGS asked for FSB. |
| National Geospatial-Intelligence Agency (NGA) | WGS 84 is “a 3-dimensional coordinate reference frame for establishing latitude, longitude and heights for navigation, positioning and targeting for the DoD, IC, NATO, International Hydrographic Office and the International Civil Aviation Organization” https://earth-info.nga.mil/index.php?action=wgs84&dir=wgs84 | WGS 84 TRF realizations aligned to ITRF (e.g. WGS 84 (G2296)) https://earth-info.nga.mil/index.php?action=gnss&dir=gnss | Named terrestrial fiducials densifying a global frame are conceptually adjacent to NGA’s monitor-station / WGS 84 maintenance role. |
| International Earth Rotation and Reference Systems Service (IERS) | Primary objectives include ICRS/ICRF, ITRS/ITRF, EOPs, conventions https://www.iers.org/iers/en/organization/about/objectives/objectives | ITRF realizations and ITRS Centre (incl. DOMES) https://www.iers.org/iers/en/dataproducts/itrf/itrf ; https://itrf.ign.fr/en/homepage | A multi-body registry that **names durable sites and ties them to official frames** parallels ITRF’s station catalogue / DOMES identification pattern for Earth. |
| International GNSS Service (IGS) | “The International GNSS Service provides, on an openly available basis, the highest-quality GNSS data, products and services in support of the terrestrial reference frame…” Values include “Advocacy of an open data policy.” https://igs.org/about-2/ | Global GNSS tracking network; products supporting ITRF https://igs.org/about-2/ | Open station metadata + coordinate products fit the IGS federation pattern of shared survey-grade sites and openly combined products. |
| International Laser Ranging Service (ILRS) | Organizes SLR/LLR; global satellite and lunar laser ranging data and products for geodesy, lunar science, ITRF https://ilrs.gsfc.nasa.gov/ ; https://ilrs.gsfc.nasa.gov/about/Overview.html | Global SLR/LLR network; LLR at Grasse, Matera, McDonald, Apache Point https://ilrs.gsfc.nasa.gov/network/index.html | Strongest lunar surface analogue today: Apollo/Lunokhod (and NGLR-class) retroreflectors are durable ranging fiducials whose observations ILRS coordinates and archives. |
| International VLBI Service for Geodesy and Astrometry (IVS) | Service supporting geodetic/astrometric research and operational activities; integrate VLBI into a global Earth observing system https://ivscc.gsfc.nasa.gov/ | VLBI network products (EOP, TRF, CRF); Technique Centre role relative to IERS/ICRF https://www.earthdata.nasa.gov/data/space-geodesy-techniques/vlbi | Less about surface disks; more about frame-defining fiducials (radio sources / stations). Body-fixed marker attestation still depends on ICRF↔body transforms that IVS/IERS underpin. |
| Global Geodetic Observing System (GGOS) | IAG framework for accurate measurements and consistent modelling of Earth-system processes; geodetic observation infrastructure https://geodesy.science/ggos/ | Integration umbrella for IGS, ILRS, IVS, IDS, IERS, etc. | A cross-technique fiducial infrastructure catalogue is the sort of interoperability object GGOS coordinates on Earth; any multi-body extension would be speculative beyond GGOS’s Earth mandate. |
| Bureau International des Poids et Mesures (BIPM) | Time Department realizes and disseminates UTC, UTCr, and TT(BIPM) https://www.bipm.org/en/time-metrology | Circular T; UTC(k) key comparison CCTF-K001.UTC | Named-authority **time** attestation (UTC / lunar reference time in LunaNet AD5 discussions) is the temporal twin of a spatial marker registry; BIPM’s lane is timing standards, not survey markers. |
| International Federation of Surveyors (FIG) | Premier international organization representing surveyors; promote professional practice and standards; UN-recognized NGO https://www.fig.net/about/index.asp | Engagement with UN-GGIM Subcommittee on Geodesy / GGRF capacity building | Survey-profession norms for monumentation, attestation, and practice standards; an FSB-like schema would be a standards/practice topic, not an operational network. |
| ISO/TC 211 | International standards for geographic information / geomatics https://committee.iso.org/sites/tc211/home/about.html | ISO Geodetic Registry (ISO 19127): authoritative CRS and transformations; supports UN-GGIM GGRF https://registry.isotc211.org/ ; https://geodetic.isotc211.org/ ; Guide to CRS Resources https://committee.iso.org/files/live/sites/tc211/files/Resources/GuideToCRSRegistries3.pdf | Closest **Earth standards pattern** for a public, named-authority registry of reference objects (CRS/transforms). An FSB marker registry is not ISOGR; ISOGR shows how geodetic items are registered under a control body. |
| Open Geospatial Consortium (OGC) | International consortium (founded 1994) developing geospatial standards https://www.opengeospatial.org/ogc/about | OGC CRS register / Definitions Server; Planetary DWG noted in joint ISO–OGC–IOGP CRS guide for planetary/astronomical CRSs (same GuideToCRSRegistries3.pdf) | Machine-readable CRS identifiers and planetary CRS work are interoperability hooks a later schema might cite — not evidence of FSB interest. |
| IAU WGCCRE | “The WGCCRE has been given the responsibility by the IAU to define the rotational elements of the planets, satellites, asteroids, and comets of the solar system on a systematic basis and to relate their cartographic coordinates rigorously to the rotational elements.” https://iau.org/WG100/WG100/Home.aspx | Periodic official reports (e.g. Archinal et al. 2018, DOI 10.1007/s10569-017-9805-5) | Any FSB on Moon/Mars/asteroids must be expressed in **WGCCRE-recommended body-fixed frames**; WGCCRE is the cartographic authority for “where is this marker?” conventions, not a marker registry. |
| NASA NAIF | SPICE system “to assist scientists in planning and interpreting scientific observations from space-based instruments aboard robotic planetary spacecraft”; also PDS Navigation Node https://naif.jpl.nasa.gov/naif/ | SPICE Toolkit; lunar/body frame kernels (e.g. `MOON_ME` / `MOON_PA` families) | FSB coordinates would practically be consumed via SPICE frames/kernels; NAIF is the distribution path for many agency frame realizations. |
| NASA SCaN / LunaNet | LNIS defines “a framework of mutually agreed-upon standards and interfaces” for cooperative lunar networks supporting communications, **PNT**, and information sharing; developed by NASA, ESA, and JAXA https://www.nasa.gov/directorates/somd/space-communications-navigation-program/lunanet-interoperability-specification/ | LNIS v5 (posted 2025-02-07) and AD-1 Vol A AFS; LNIS set includes **AD5** lunar reference/time (TBD). Spec PDF: https://www.nasa.gov/wp-content/uploads/2025/02/lunanet-interoperability-specification-v5-baseline.pdf | Among the **strongest** theoretical fits: LunaNet PNT interoperability depends on shared lunar geodetic reference and time. A public registry of durable surface fiducials could support LANS/PNT validation and frame densification *if* ever considered — **not claimed**. |
| ESA Moonlight / LCNS | Moonlight: ESA dedicated satellite constellation for lunar telecommunication and navigation; LCNS partnership (Telespazio-led) https://www.esa.int/Applications/Connectivity_and_Secure_Communications/ESA_s_Moonlight_programme_Pioneering_the_path_for_lunar_exploration ; https://resilience.esa.int/moonlight | Moonlight LCNS; stated compliance with LunaNet | As a lunar navigation service provider, LCNS performance and reference realization could theoretically benefit from attested surface fiducials (same caveat: no ESA request). |
| USGS Astrogeology Science Center | Founded 1963 to map the Moon; planetary maps and cartographic products “made available to the international scientific community and the general public as a national resource” https://www.usgs.gov/faqs/does-usgs-produce-mapping-other-planetary-bodies | Gazetteer of Planetary Nomenclature (with IAU WGPSN) https://planetarynames.wr.usgs.gov/ ; ISIS control networks https://astrogeology.usgs.gov/docs/concepts/control-networks/isis-control-networks/ | Closest planetary-cartography analogue to a public point registry (named features ≠ survey beacons, but control points are survey-adjacent). |
| NASA GSFC Space Geodesy / Apache Point LLR | NASA stewardship of Apache Point LLR within the Space Geodesy Network (program FACT) | Apache Point Lunar Laser Ranging Station; millimeter-class LLR; normal points to CDDIS https://earth.gsfc.nasa.gov/geo/networks/sgp/sites/apache-point ; https://www.earthdata.nasa.gov/data/space-geodesy-techniques/slr/lunar-laser-ranging-data | Operational ranging to **existing** lunar surface retroreflector fiducials; any new survey-grade lunar markers with optical/laser interfaces would intersect this observing program’s target set. |
| Observatoire de la Côte d’Azur (MéO / Grasse) | OCA laser telemetry service: metrology instrumentation; continuous ranging; contribute to reference systems. MéO 1.54 m ranges to satellites and the Moon; ILRS-integrated https://lagrange.oca.eu/en/laser-telemetry | ILRS station GRSM / 7845 https://ilrs.gsfc.nasa.gov/network/stations/index.html | Major LLR producer against lunar surface arrays — natural stakeholder class for any future lunar surface fiducial list (theoretical). |
| Crustal Dynamics Data Information System (CDDIS) | NASA DAAC for the international space geodesy community; core archive for IAG geometric services https://www.earthdata.nasa.gov/centers/cddis-daac | Global DC for IGS, ILRS, IVS, IDS, IERS; LLR archives | Natural publication/archive venue if FSB-related geodetic observations or site logs ever existed (they do not, in this theoretical scan). |
| Consultative Committee for Space Data Systems (CCSDS) | Agency forum for Recommended Standards/Practices promoting interoperability and cross-support; standards free to download (ccsds.org) | Recommended Standards; SANA registries | Named registries / protocol identifiers as an attestation **pattern**. An FSB registry is not a CCSDS registry today. |
| Space Assigned Numbers Authority (SANA) | “The Space Assigned Numbers Authority (SANA) is the registrar function for the protocol registries created under [CCSDS].” https://www.sanaregistry.org/ | sanaregistry.org (Yellow Books 313.0 / 313.1) | Working example of a **public, named-authority space registry**. Governance pattern (control board + public register) is the inference hook, not a present FSB register. |
| Space Frequency Coordination Group (SFCG) | “Pre-eminent radio-frequency collegiate of Space Agencies…”; coordinates ITU-allocated space-service bands https://sfcgonline.org/about/ | Multilateral frequency coordination; Rec 32-2 lunar-region frequencies (quoted by LSIS-AFS; primary PDF **GAP**) | RF-spectrum adjacency only — if beacons radiated RNSS-like signals, SFCG/ITU coordination would matter. **Not** a cartographic/control-network authority. |
| Interagency Operations Advisory Group (IOAG) | Founded by IOP to understand interagency interoperability in space communications/navigation; recommend actions to IOP https://ioag.org/ ; ToR https://ioag.org/wp-content/uploads/2025/03/IOAG-Terms-of-Reference.pdf | Space comms/nav interoperability; coordination with CCSDS/SFCG; cislunar PNT / LunaNet-related engagement | Policy/ops forum where lunar PNT interoperability (hence reference/time and possibly surface aids) is discussed at agency level — still not an FSB request. |
| Committee on Earth Observation Satellites (CEOS) | Established 1984 to coordinate/harmonize Earth observations; interoperability, common formats, cal/val https://ceos.org/about-ceos/ | Working Groups / Virtual Constellations; data interoperability | Weaker FSB fit — Earth EO interoperability rather than survey monuments. Included because listed in the authorities harvest; any link would be indirect. |
| UN-GGIM / Subcommittee on Geodesy | ECOSOC apex intergovernmental mechanism on geospatial information https://ggim.un.org/ | Global Geodetic Reference Frame for Sustainable Development (UNGA Res. 69/266) https://ggim.un.org/documents/A_RES_69_266_E.pdf ; UN Global Geodetic Centre of Excellence | International governance and data-sharing norms for geodetic frames; an Earth FSB-like open registry would sit under GGRF interoperability politics, not under UN operational control of markers. |
| JAXA (lunar PNT / LNSS) | NASA LNIS page: LNIS collaboratively developed by NASA, ESA, and **JAXA** (same LNIS URL as LunaNet row) | LNSS / LANS interoperability described in JAXA-authored ICG/UNOOSA PDFs e.g. https://www.unoosa.org/documents/pdf/icg/2024/WG-B_Lunar_PNT_Jun24/LunarPNT_Jun24_01_05.pdf — **do not treat ICG PDFs as a jaxa.jp programme charter** | As an LNSP, same theoretical adjacency to lunar reference frames and possible surface aids as NASA LCRNS / ESA LCNS. **Partial:** dedicated English jaxa.jp LNSS mandate page **not** confirmed (**GAP**). |

**Strongest INFERENCE candidates (not requests):** (1) NASA LunaNet / LNIS — shared lunar geodetic reference & time; (2) ILRS + Apache Point / OCA MéO — existing durable lunar surface ranging fiducials; (3) IAU WGCCRE + USGS ASC — body-fixed conventions + planetary control-point / nomenclature infrastructure; (4) NOAA NGS (NSRS) — Earth template for a public attested survey-mark network; (5) ISO/TC 211 ISO Geodetic Registry + OGC CRS / SANA — governance patterns for public named-authority registries.

---

## 4. Recommended-for-schema shortlist (open-first)

Existing official names only. The schema (written elsewhere) should **reference** these; it must **not** redefine them or invent identifiers. Prefer-open ranking: freely downloadable IERS/IGN, NAIF, SANA, NASA, ITU/BIPM, NGS, USGS-reprint products over paywalled Springer bodies or PKI-gated NGA registries (cite the latter by name when GNSS/DoD alignment is required).

**Global / inertial / time (prefer as defaults where applicable)**

1. **ITRF2020** — Earth crust-fixed TRF (IERS/IGN open products).  
2. **WGS 84** (optionally realization **WGS 84 (G2296)**) — GNSS/DoD global; public NGA docs.  
3. **GRS80** — ellipsoid name only; do not republish constants.  
4. **ICRF3** / **ICRS** — inertial.  
5. **MOON_ME** (SANA/NAIF; realization `MOON_ME_DE440_ME421` when DE must be named) — lunar surface / cartography.  
6. **MOON_PA** (SANA `MOON_PAxxx` / NAIF; e.g. `MOON_PA_DE440`) — lunar dynamics / gravity, **not** default pad coordinates.  
7. **IAU_MARS** — Mars body-fixed / cartographic SPICE name (WGCCRE parameters in PCKs).  
8. **UTC**, **TAI**, **TT**, **TDB** — time. Lunar epochs: cite **LRT** (LNIS) and/or **LTC** (OSTP) **as distinct names** pending AD5; do not mint a fused identifier.  
9. **SANA** celestial-body reference-frame values as exchange vocabulary where CCSDS applies (`ITRF`, `ICRF`, `MOON_ME`, `WGS84`, `FIXED_CB`, …).

**Optional national/regional examples (not global defaults):** `NAD 83`, `ETRS89`.

**Analog-only (documentation / examples; not FSB sim identity):** `IAU_BENNU`, `EROS_FIXED`, `RYUGU_FIXED` / `IAU_RYUGU`.

**Do not invent:** any official name for the FSB simulated asteroid body-fixed frame; `lunar_xyz_v1`; fused `LTC/LRT`; unpublished WGCCRE-DE440 report identifiers; AFS frequencies other than the LSIS-020 value **2492.028 MHz** inside **2483.5–2500 MHz**.

---

## 5. Gaps

Harvested from frames scratch, authorities scratch, and corpus-cite scratch. Unverified → GAP; do not fill.

| GAP | Detail |
|---|---|
| **LNIS AD5** (`{LNIS-TBD-AD0005}`) | *Lunar Reference System and LunaNet Reference Time System Standard* referenced throughout LNIS v5; marked TBD / not yet available. Blocks detailed LRT definition. |
| **Formal LTC ≡ LRT** | Not found. Treat OSTP **LTC** and LNIS **LRT** as distinct pending AD5 / international standards. |
| **Post-2015 peer-reviewed WGCCRE main report adopting DE440 ME** | LPSC 2023/2024 abstracts indicate intent; no newer CMDA report DOI retrieved. Formal report in hand remains Archinal et al. 2018 (2015 report), DOI 10.1007/s10569-017-9805-5. |
| **IAU WGCCRE 2015 PDF binary / Mars numeric parameters** | DOI and Astropedia/USGS URLs verified; PDF bytes not retrieved (TLS EOF / non-200). Do **not** invent radii/orientation numbers. |
| **SFCG Recommendation 32-2 (R5/R6) primary PDF** | Band content quoted by LSIS-AFS; direct sfcgonline.org PDF URLs returned HTTP 404. Do not invent SFCG clause text. |
| **Deployed / baselined cm-class LLR+VLBI surface-station mandate** | Only proposal-class NovaMoon text retrieved for the corpus cm-class claim; not a baselined LNIS/AD5 requirement. NovaMoon DOI not verified beyond arXiv id `2602.08432`. |
| **NGA.STND.0036 full text / NSG registry** | Landing page verified; DISR/NSG Standards Registry may require PKI — full standard PDF not independently archived here. |
| **EUREF TN1 PDF bytes** | Official URL verified; HTTP fetch flaky from research box. |
| **CCSDS 500.0-G-4 full PDF** | SANA registry retrieved; Blue/Green Book PDF not re-fetched (non-blocking for `MOON_ME`). |
| **CNSA / CLEP cartography (English)** | CNSA portal found; no verified English-language official CLEP planetary cartography / control-network programme page suitable to quote. |
| **USGS as terrestrial NSRS-class geodetic control authority** | Terrestrial NSRS mandate and marked-point network are **NOAA NGS**, not USGS. USGS ASC covered for planetary. |
| **JAXA LNSS “home” charter page on jaxa.jp** | LNSS described in JAXA-authored ICG/UNOOSA PDFs and via NASA LNIS co-developer statement; dedicated English jaxa.jp LNSS programme mandate page not confirmed. |
| **OGC Planetary DWG standalone charter page** | Planetary CRS role attested in ISO–OGC–IOGP CRS guide; separate OGC DWG “about” page with full mandate quote not independently captured. |
| **FSB simulated asteroid** | **FACT:** no official frame — explicit non-existence, not a missing document of an existing frame. |
| **MRO “operational body frame” as a distinct named datum** | MOLA/MGS cartographic usage documented under IAU2000/`IAU_MARS`; no separate MRO-named Mars surface datum found. |
| **SPICE ↔ SANA exact synonymy** | SANA `WGS84` frame-type field says “Inertial” while NGA defines ECEF — registry metadata quirk; treat with care. |

---

## 6. Audit pointers

This note is a polished synthesis. Underlying harvests (do not treat as the deliverable):

| File | Role |
|---|---|
| `research/_scratch_frames.md` | Frames table harvest: IERS/NGA/NGS/EUREF/IAU/NAIF/SANA/BIPM/ITU/PDS citations, prefer-open flags, license notes, fetch log. |
| `research/_scratch_authorities.md` | Per-org mandate/program URLs, INFERENCE FSB-fit text, authorities GAP list, strongest-INFERENCE ranking. |
| `research/_scratch_corpus_cites.md` | Official URL/DOI harvest for every corpus-named item; CONFLICT/GAP flags (LTC vs LRT; WGCCRE DE440 report status; AFS tilde vs LSIS exact). |
| `research/SOURCE_THIS_THREAD.md` | Prior art + design intent (**not surveyed data**). Named ME/PA/SANA/UTC/LTC/LRT/LNIS/AFS/LLR/VLBI claims originate here. |
| `handoffs/2026-09-03-research-frames-authorities.md` | Assignment / done test this file is written to satisfy. |

**Method (scratches):** official `.gov` / `.int` / society pages and agency PDFs; Wikipedia not used as a citation. **No schemas, hardware, APIs, or patent text.** **No organization is stated to have requested FSB.**

---

*End of draft research note. Phase-1 scope. Names referenced, not redefined.*
