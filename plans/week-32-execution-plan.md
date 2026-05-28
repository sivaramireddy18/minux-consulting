# Weekly Execution Plan: Week 32

## 🎯 Weekly Goal
Master the industry-standard **Yocto Project** build system, understand the layers metadata architecture, write custom recipes (`.bb`) to compile source packages, create dynamic system configuration layers, and build secure production OS images using BitBake.

## 🏆 Weekly Outcome
By Friday, the student will have designed and compiled a custom **Yocto BSP (Board Support Package) Layer** from scratch. They will understand BitBake task execution lifecycles, how to write recipes containing build dependencies, and how to verify compiled custom images on physical hardware.

---

## 📅 Session Breakdown (Monday - Friday)

### Monday: The Yocto Project & Metadata Layers Architecture
* **Conceptual Objective**: Master the architecture of the Yocto Project—the universal standard for enterprise-grade Embedded Linux OS creation. Understand that Yocto is not a Linux distribution, but a collaborative project providing tools and templates. Learn the **Metadata Layers** design pattern: everything is organized in layers prefixed with `meta-` (e.g., `meta-raspberrypi`), allowing developers to extend configurations cleanly without modifying core systems code.
* **Practical Activity**:
  1. Set up host system build dependencies.
  2. Clone the core Yocto Project repository (**Poky**) and locate the base layers structure.
* **Code/Circuit Reference**:
```bash
# Poky Workspace Layout:
poky/
├── bitbake/          # The engine: parses metadata and executes tasks
├── meta/             # Core metadata recipes
├── meta-poky/        # Poky distribution configurations
└── meta-yocto-bsp/   # Default board configurations
```

### Tuesday: BitBake Task Lifecycles & Build Variables
* **Conceptual Objective**: Study **BitBake**—the execution engine of Yocto. Learn how BitBake parses recipes to execute specific task steps: `do_fetch` (gets source code), `do_unpack`, `do_patch`, `do_configure`, `do_compile`, `do_install` (copies outputs into target directory), and `do_package`. Master Yocto assignment variables: `=` (static), `?=` (conditional default), `??=` (lazy default), `+=` (append with space), and `_append` (overrides suffix).
* **Practical Activity**:
  1. Initialize the Poky build environment.
  2. Run simple target compilation commands.
* **Code/Circuit Reference**:
```bash
# Initialize build environment (creates build/ directory)
source poky/oe-init-build-env build/

# Check environment parameters inside build/conf/local.conf
# Set target machine (e.g., Raspberry Pi 4)
MACHINE = "raspberrypi4-64"
```

### Wednesday: Creating a Custom Metadata Layer
* **Conceptual Objective**: Learn how to create a custom metadata layer to house your company's configurations and hardware descriptions. Understand the roles of `layer.conf` and `bblayers.conf` files.
* **Practical Activity**:
  1. Create a custom layer directory `meta-custom-gateway` using the Yocto layer tool.
  2. Integrate the layer into your active build configurations.
* **Code/Circuit Reference**:
```bash
# Create custom layer
bitbake-layers create-layer ../meta-custom-gateway

# Add layer to active build configuration
bitbake-layers add-layer ../meta-custom-gateway
```

### Thursday: Writing Custom Yocto Recipes (`.bb`)
* **Conceptual Objective**: Master Yocto **Recipes**—text files containing variables and tasks detailing how to fetch, compile, and package applications. Study the required fields: `SUMMARY`, `LICENSE`, `LIC_FILES_CHKSUM` (enforces exact licensing audits), `SRC_URI` (source code repository link), and system installation path macros (`${D}` destination, `${bindir}` binary directory).
* **Practical Activity**:
  1. Write a custom recipe compiling a C application.
  2. Test compilation tasks individually.
* **Code/Circuit Reference**:
```kconfig
# meta-custom-gateway/recipes-apps/telemetry/telemetry_1.0.bb
SUMMARY = "Custom Telemetry Service Application"
LICENSE = "MIT"
LIC_FILES_CHKSUM = "file://${COMMON_LICENSE_DIR}/MIT;md5=0835ade698e0bcf8506ecda2f7b4f302"

SRC_URI = "file://telemetry.c"

S = "${WORKDIR}"

do_compile() {
    ${CC} ${CFLAGS} ${LDFLAGS} telemetry.c -o telemetry_bin
}

do_install() {
    install -d ${D}${bindir}
    install -m 0755 telemetry_bin ${D}${bindir}/telemetry_bin
}
```

### Friday: Compiling and Customizing the OS Image
* **Conceptual Objective**: Understand how to customize the final operating system image. Learn how to inherit classes (e.g., `image.bbclass`), enable specific package features directly via recipes, and trigger target BitBake builds.
* **Practical Activity**:
  1. Write a custom image recipe that inherits Poky's base image and automatically appends your custom telemetry package.
  2. Build and verify the final image.
* **Code/Circuit Reference**:
```bash
# Compile the minimal target image containing your custom layer
bitbake core-image-minimal

# Locate compiled flashable outputs in deploy folder
# build/tmp/deploy/images/raspberrypi4-64/core-image-minimal-raspberrypi4-64.wic
```

---

## 🛠️ Hands-On Assignment: Custom Gateway Metadata Layer and Recipe

### Functional Requirements
Create a fully custom, production-grade Yocto Metadata Layer and write a recipe compiling a C application dynamically.
1. Download Poky and configure a Yocto workspace.
2. Create a custom layer named `meta-industrial-gateway` and integrate it into `bblayers.conf`.
3. Inside your custom layer, write a recipe named `telemetry-app_1.0.bb` that:
   - Fetches a local C source code file `telemetry_app.c` (or a remote Git repository link).
   - Audits MIT licensing cleanly.
   - Compiles the code during `do_compile`.
   - Installs the compiled binary into the target `/usr/bin/` folder.
4. Modify `build/conf/local.conf` to automatically append your custom package to the final system image build: `IMAGE_INSTALL_append = " telemetry-app"`.
5. Trigger BitBake to build `core-image-minimal`.
6. Verify the successful compilation, locate the generated `.wic` or `.sdcard` flashable image, and check that your package exists in the target deploy directory.

### Structural Requirements & Code Skeleton
**`meta-industrial-gateway/conf/layer.conf`**:
```kconfig
BBPATH .= ":${LAYERDIR}"
BBFILES += "${LAYERDIR}/recipes-*/*/*.bb \
            ${LAYERDIR}/recipes-*/*/*.bbappend"

BBFILE_COLLECTIONS += "meta-industrial-gateway"
BBFILE_PATTERN_meta-industrial-gateway = "^${LAYERDIR}/"
BBFILE_PRIORITY_meta-industrial-gateway = "6"

LAYERSERIES_COMPAT_meta-industrial-gateway = "kirkstone"
```

---

## 📦 Deliverables
* [ ] Custom layer folder `meta-industrial-gateway` containing conf and recipe structures.
* [ ] Recipe file `telemetry-app_1.0.bb` and matching source `telemetry_app.c`.
* [ ] Output build log `bitbake_run.log` demonstrating successful image compilation.

---

## ❓ Self-Check Questions
1. Differentiate **poky**, **BitBake**, and **OpenEmbedded**. How do they interact to construct a Yocto image?
2. What are **Metadata Layers**? Why are they highly superior to hardcoded changes inside system directories when customizing large projects?
3. Walk through the BitBake task execution order. What does `${D}` represent, and why must files be placed inside `${D}${bindir}` instead of direct root directories?
4. What is the role of `LIC_FILES_CHKSUM`? What happens if you modify the license file string without updating the checksum?
5. How do you append custom packages to a final image using `local.conf` variables?

---

## 🚀 Stretch Task (Optional)
Extend the layer to support a **systemd service recipe**: write a custom Yocto recipe that automatically installs a systemd configuration file, enabling your telemetry application to start automatically as a systemd service at boot.

## 💡 Motivation Checkpoint
Inside enterprise organizations (such as Tesla, Garmin, or Siemens), Yocto is the gold standard. Every Board Support Package (BSP) and application layer is modularized: if the silicon vendor releases a new hardware revision, you only swap the base BSP layer, leaving all proprietary application recipes untouched. Mastering Yocto is the hallmark of senior systems developers.

## 📝 Trainer Review Rule
* **Pass Criteria**:
  - Custom Yocto layer compiles cleanly using BitBake.
  - Core image builds successfully with the custom package included.
  - License checksums are audited correctly.
* **Fail Criteria**:
  - Hardcoded paths in recipes that fail on other hosts.
  - Bypassing license validation directives.
